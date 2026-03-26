'use server'

import Stripe from 'stripe'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Business, UpdateBusiness } from '@/types/database.types'

interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }

  return new Stripe(secretKey)
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

function getPlanFromTableCount(tableCount: number) {
  if (tableCount <= 15) {
    return {
      plan: 'starter',
      name: 'TableOrder Starter',
      price: 1500,
    }
  }

  if (tableCount <= 25) {
    return {
      plan: 'growth',
      name: 'TableOrder Growth',
      price: 2500,
    }
  }

  return {
    plan: 'pro',
    name: 'TableOrder Pro',
    price: 3500,
  }
}

export async function getCurrentBusiness(): Promise<ActionResult<Business>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('businesses')
    .select('*, business_users!inner(user_id, role)')
    .eq('business_users.user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Η επιχείρηση δεν βρέθηκε.' }

  return { data: data as unknown as Business, error: null }
}

export async function createBusiness(
  formData: FormData,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'Not authenticated' }

  const name = (formData.get('name') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim().toLowerCase()
  const currency = (formData.get('currency') as string) || 'EUR'

  if (!name || !slug) {
    return { data: null, error: 'Απαιτείται όνομα και URL slug.' }
  }

  if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slug)) {
    return {
      data: null,
      error:
        'Το slug πρέπει να περιέχει μόνο πεζά γράμματα, αριθμούς και παύλες (π.χ. my-cafe).',
    }
  }

  const { data: existing } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return { data: null, error: 'Αυτό το slug χρησιμοποιείται ήδη. Επιλέξτε άλλο.' }
  }

  const now = new Date()
  const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const { data: business, error: bizError } = await admin
    .from('businesses')
    .insert({
      name,
      slug,
      currency,
      default_language: 'el',
      account_status: 'trialing',
      trial_starts_at: now.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      subscription_status: 'trialing',
      subscription_plan: 'trial',
    })
    .select('id, slug')
    .single()

  if (bizError) return { data: null, error: bizError.message }
  if (!business) return { data: null, error: 'Αποτυχία δημιουργίας επιχείρησης.' }

  const { error: memberError } = await admin
    .from('business_users')
    .insert({
      business_id: business.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) {
    await admin.from('businesses').delete().eq('id', business.id)
    return { data: null, error: memberError.message }
  }

  revalidatePath('/dashboard')
  return { data: business as { id: string; slug: string }, error: null }
}

export async function updateBusiness(
  businessId: string,
  updates: UpdateBusiness,
): Promise<ActionResult<Business>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('businesses')
    .update(updates as never)
    .eq('id', businessId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Η επιχείρηση δεν βρέθηκε.' }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')
  return { data: data as unknown as Business, error: null }
}

export async function uploadLogo(
  businessId: string,
  formData: FormData,
): Promise<ActionResult<string>> {
  const supabase = await createClient()

  const file = formData.get('logo') as File | null

  if (!file || file.size === 0) {
    return { data: null, error: 'Δεν επιλέχθηκε αρχείο.' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { data: null, error: 'Το αρχείο δεν μπορεί να υπερβαίνει τα 5 MB.' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${businessId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('business-assets')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { data: null, error: uploadError.message }

  const { data: signed, error: urlError } = await supabase.storage
    .from('business-assets')
    .createSignedUrl(path, 60 * 60 * 24 * 365)

  if (urlError || !signed?.signedUrl) {
    return { data: null, error: 'Αποτυχία δημιουργίας URL.' }
  }

  const { error: updateError } = await supabase
    .from('businesses')
    .update({ logo_url: signed.signedUrl } as never)
    .eq('id', businessId)

  if (updateError) return { data: null, error: updateError.message }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/settings')
  return { data: signed.signedUrl, error: null }
}

export async function createStripeCheckoutSession(): Promise<void> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const stripe = getStripeClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: businessData, error: businessError } = await supabase
    .from('businesses')
    .select('*, business_users!inner(user_id)')
    .eq('business_users.user_id', user.id)
    .eq('is_active', true)
    .single()

  if (businessError || !businessData) {
    throw new Error('Δεν βρέθηκε επιχείρηση για checkout.')
  }

  const business = businessData as unknown as Business

  const { count: tableCount, error: tableCountError } = await supabase
    .from('tables')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('is_active', true)

  if (tableCountError) {
    throw new Error(tableCountError.message)
  }

  const resolvedTableCount = tableCount ?? 0
  const selectedPlan = getPlanFromTableCount(resolvedTableCount)

  const profileResult = await supabase.auth.getUser()
  const email = profileResult.data.user?.email

  let stripeCustomerId = business.stripe_customer_id

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      name: business.name,
      metadata: {
        business_id: business.id,
        business_slug: business.slug,
      },
    })

    stripeCustomerId = customer.id

    const { error: customerUpdateError } = await admin
      .from('businesses')
      .update({ stripe_customer_id: stripeCustomerId } as never)
      .eq('id', business.id)

    if (customerUpdateError) {
      throw new Error(customerUpdateError.message)
    }
  }

  const appUrl = getAppUrl()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=cancel`,
    metadata: {
      business_id: business.id,
      subscription_plan: selectedPlan.plan,
      table_count: String(resolvedTableCount),
    },
    subscription_data: {
      metadata: {
        business_id: business.id,
        subscription_plan: selectedPlan.plan,
        table_count: String(resolvedTableCount),
      },
    },
    line_items: [
      {
        price_data: {
          currency: (business.currency || 'EUR').toLowerCase(),
          product_data: {
            name: selectedPlan.name,
            description: `Συνδρομή ${selectedPlan.plan} για ${resolvedTableCount} τραπέζια`,
            metadata: {
              business_id: business.id,
              subscription_plan: selectedPlan.plan,
            },
          },
          recurring: {
            interval: 'month',
          },
          unit_amount: selectedPlan.price,
        },
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
  })

  if (!session.url) {
    throw new Error('Αποτυχία δημιουργίας Stripe checkout session.')
  }

  redirect(session.url)
}

export async function createStripePortalSession(): Promise<void> {
  const supabase = await createClient()
  const stripe = getStripeClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: businessData, error: businessError } = await supabase
    .from('businesses')
    .select('*, business_users!inner(user_id)')
    .eq('business_users.user_id', user.id)
    .eq('is_active', true)
    .single()

  if (businessError || !businessData) {
    throw new Error('Δεν βρέθηκε επιχείρηση για portal.')
  }

  const business = businessData as unknown as Business

  if (!business.stripe_customer_id) {
    throw new Error(
      'Δεν υπάρχει Stripe customer για αυτή την επιχείρηση. Κάντε πρώτα checkout.',
    )
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: business.stripe_customer_id,
    return_url: `${getAppUrl()}/dashboard/billing`,
  })

  if (!session.url) {
    throw new Error('Αποτυχία δημιουργίας Stripe customer portal session.')
  }

  redirect(session.url)
}