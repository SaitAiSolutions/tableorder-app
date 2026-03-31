import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }

  return new Stripe(secretKey)
}

function getWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET')
  }

  return webhookSecret
}

function toIsoOrNull(value: number | null | undefined) {
  if (!value) return null
  return new Date(value * 1000).toISOString()
}

function getAccountStatusFromSubscriptionStatus(status: string) {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'past_due') return 'grace_period'
  if (status === 'unpaid') return 'suspended'
  if (status === 'canceled') return 'cancelled'
  return 'active'
}

function getInternalSubscriptionStatus(status: string) {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'past_due') return 'past_due'
  if (status === 'unpaid') return 'unpaid'
  if (status === 'canceled') return 'cancelled'
  return 'active'
}

async function calculateOutstandingBalance(
  stripe: Stripe,
  customerId: string,
): Promise<number> {
  let total = 0
  let startingAfter: string | undefined

  while (true) {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      status: 'open',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })

    for (const invoice of invoices.data) {
      total += Number(invoice.amount_remaining ?? 0) / 100
    }

    if (!invoices.has_more || invoices.data.length === 0) {
      break
    }

    startingAfter = invoices.data[invoices.data.length - 1]?.id
  }

  return Number(total.toFixed(2))
}

async function syncOutstandingBalanceForBusiness(
  stripe: Stripe,
  businessId: string,
  customerId: string | null | undefined,
) {
  const admin = createAdminClient()

  const outstandingBalance = customerId
    ? await calculateOutstandingBalance(stripe, customerId)
    : 0

  const { error } = await admin
    .from('businesses')
    .update({
      outstanding_balance: outstandingBalance,
    } as never)
    .eq('id', businessId)

  if (error) {
    throw new Error(error.message)
  }

  return outstandingBalance
}

async function getBusinessById(businessId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('businesses')
    .select(
      'id, billing_exempt, stripe_customer_id, stripe_subscription_id, is_active',
    )
    .eq('id', businessId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as
    | {
        id: string
        billing_exempt: boolean | null
        stripe_customer_id: string | null
        stripe_subscription_id: string | null
        is_active: boolean | null
      }
    | null
}

async function findBusinessBySubscriptionId(subscriptionId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('businesses')
    .select('id, stripe_customer_id, stripe_subscription_id, billing_exempt, is_active')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as
    | {
        id: string
        stripe_customer_id: string | null
        stripe_subscription_id: string | null
        billing_exempt: boolean | null
        is_active: boolean | null
      }
    | null
}

async function findBusinessByCustomerId(customerId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('businesses')
    .select('id, stripe_customer_id, stripe_subscription_id, billing_exempt, is_active')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as
    | {
        id: string
        stripe_customer_id: string | null
        stripe_subscription_id: string | null
        billing_exempt: boolean | null
        is_active: boolean | null
      }
    | null
}

async function updateBusinessFromSubscription(subscription: Stripe.Subscription) {
  const admin = createAdminClient()

  const businessId = subscription.metadata?.business_id
  if (!businessId) return

  const business = await getBusinessById(businessId)
  if (!business?.id || business.is_active === false) return

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id ?? null

  const nextAccountStatus = getAccountStatusFromSubscriptionStatus(
    subscription.status,
  )

  const nextSubscriptionStatus = getInternalSubscriptionStatus(
    subscription.status,
  )

  const gracePeriodEndsAt =
    subscription.status === 'past_due'
      ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      : null

  const billingExempt = Boolean(business.billing_exempt)

  const payload = billingExempt
    ? {
        account_status: 'active',
        subscription_status: nextSubscriptionStatus,
        subscription_plan: subscription.metadata?.subscription_plan ?? null,
        stripe_customer_id: customerId,
        stripe_subscription_id:
          subscription.status === 'canceled' ? null : subscription.id,
        current_period_starts_at: toIsoOrNull(subscription.current_period_start),
        current_period_ends_at: toIsoOrNull(subscription.current_period_end),
        grace_period_ends_at: null,
        suspended_at: null,
        last_payment_failed_at: null,
      }
    : {
        account_status: nextAccountStatus,
        subscription_status: nextSubscriptionStatus,
        subscription_plan: subscription.metadata?.subscription_plan ?? null,
        stripe_customer_id: customerId,
        stripe_subscription_id:
          subscription.status === 'canceled' ? null : subscription.id,
        current_period_starts_at: toIsoOrNull(subscription.current_period_start),
        current_period_ends_at: toIsoOrNull(subscription.current_period_end),
        grace_period_ends_at: gracePeriodEndsAt,
        suspended_at:
          subscription.status === 'unpaid' ? new Date().toISOString() : null,
        ...(subscription.status === 'active' || subscription.status === 'trialing'
          ? {
              last_payment_failed_at: null,
            }
          : {}),
      }

  const { error } = await admin
    .from('businesses')
    .update(payload as never)
    .eq('id', businessId)

  if (error) {
    throw new Error(error.message)
  }

  return { businessId, customerId }
}

export async function POST(req: Request) {
  const stripe = getStripeClient()
  const webhookSecret = getWebhookSecret()

  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    )
  }

  const rawBody = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Webhook signature failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'subscription') {
          break
        }

        const businessId = session.metadata?.business_id ?? null
        if (!businessId) break

        const business = await getBusinessById(businessId)
        if (!business?.id || business.is_active === false) break

        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id ?? null

        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? null

        let plan = session.metadata?.subscription_plan ?? 'starter'
        let currentPeriodStart: string | null = null
        let currentPeriodEnd: string | null = null

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          plan = subscription.metadata?.subscription_plan || plan
          currentPeriodStart = toIsoOrNull(subscription.current_period_start)
          currentPeriodEnd = toIsoOrNull(subscription.current_period_end)
        }

        const admin = createAdminClient()

        const { error } = await admin
          .from('businesses')
          .update({
            account_status: 'active',
            subscription_status: 'active',
            subscription_plan: plan,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            current_period_starts_at: currentPeriodStart,
            current_period_ends_at: currentPeriodEnd,
            grace_period_ends_at: null,
            suspended_at: null,
            last_payment_failed_at: null,
          } as never)
          .eq('id', businessId)

        if (error) {
          throw new Error(error.message)
        }

        await syncOutstandingBalanceForBusiness(stripe, businessId, customerId)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const updated = await updateBusinessFromSubscription(subscription)

        if (updated?.businessId) {
          await syncOutstandingBalanceForBusiness(
            stripe,
            updated.businessId,
            updated.customerId,
          )
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const updated = await updateBusinessFromSubscription(subscription)

        if (updated?.businessId) {
          await syncOutstandingBalanceForBusiness(
            stripe,
            updated.businessId,
            updated.customerId,
          )
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id ?? null

        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id ?? null

        let businessRow:
          | {
              id: string
              stripe_customer_id: string | null
              stripe_subscription_id: string | null
              billing_exempt: boolean | null
              is_active: boolean | null
            }
          | null = null

        if (subscriptionId) {
          businessRow = await findBusinessBySubscriptionId(subscriptionId)
        }

        if (!businessRow && customerId) {
          businessRow = await findBusinessByCustomerId(customerId)
        }

        if (!businessRow?.id || businessRow.is_active === false) break

        if (businessRow.billing_exempt) {
          await syncOutstandingBalanceForBusiness(
            stripe,
            businessRow.id,
            customerId ?? businessRow.stripe_customer_id,
          )
          break
        }

        const admin = createAdminClient()

        const { error } = await admin
          .from('businesses')
          .update({
            account_status: 'grace_period',
            subscription_status: 'past_due',
            grace_period_ends_at: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            last_payment_failed_at: new Date().toISOString(),
          } as never)
          .eq('id', businessRow.id)

        if (error) {
          throw new Error(error.message)
        }

        await syncOutstandingBalanceForBusiness(
          stripe,
          businessRow.id,
          customerId ?? businessRow.stripe_customer_id,
        )

        break
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id ?? null

        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id ?? null

        let businessRow:
          | {
              id: string
              stripe_customer_id: string | null
              stripe_subscription_id: string | null
              billing_exempt: boolean | null
              is_active: boolean | null
            }
          | null = null

        if (subscriptionId) {
          businessRow = await findBusinessBySubscriptionId(subscriptionId)
        }

        if (!businessRow && customerId) {
          businessRow = await findBusinessByCustomerId(customerId)
        }

        if (!businessRow?.id || businessRow.is_active === false) break

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const updated = await updateBusinessFromSubscription(subscription)

          if (updated?.businessId) {
            const admin = createAdminClient()
            const business = await getBusinessById(updated.businessId)
            const billingExempt = Boolean(business?.billing_exempt)

            const { error } = await admin
              .from('businesses')
              .update({
                account_status: 'active',
                subscription_status: 'active',
                grace_period_ends_at: null,
                suspended_at: null,
                last_payment_failed_at: null,
                ...(billingExempt ? {} : {}),
              } as never)
              .eq('id', updated.businessId)

            if (error) {
              throw new Error(error.message)
            }

            await syncOutstandingBalanceForBusiness(
              stripe,
              updated.businessId,
              updated.customerId,
            )
          }
        } else {
          const admin = createAdminClient()
          const billingExempt = Boolean(businessRow.billing_exempt)

          const { error } = await admin
            .from('businesses')
            .update({
              account_status: 'active',
              subscription_status: 'active',
              grace_period_ends_at: null,
              suspended_at: null,
              last_payment_failed_at: null,
              ...(billingExempt ? {} : {}),
            } as never)
            .eq('id', businessRow.id)

          if (error) {
            throw new Error(error.message)
          }

          await syncOutstandingBalanceForBusiness(
            stripe,
            businessRow.id,
            customerId ?? businessRow.stripe_customer_id,
          )
        }

        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Webhook handler failed'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}