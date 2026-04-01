'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentBusiness } from '@/lib/actions/business.actions'

interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

export type PrintingMode =
  | 'disabled'
  | 'browser'
  | 'escpos_network'
  | 'make_printnode'

export type PrinterSettingsRow = {
  id: string
  business_id: string
  name: string
  is_enabled: boolean
  is_default: boolean
  printing_mode: PrintingMode
  connection_type: 'wifi' | 'ethernet' | 'browser'
  printer_brand: string | null
  printer_model: string | null
  printer_ip: string | null
  printer_port: number | null
  paper_width: '58mm' | '80mm'
  characters_per_line: number
  auto_print_orders: boolean
  auto_print_service_requests: boolean
  auto_print_bills: boolean
  copies_count: number
  cut_paper: boolean
  open_cash_drawer: boolean
  header_text: string | null
  footer_text: string | null
  make_webhook_url: string | null
  printnode_printer_id: string | null
  last_tested_at: string | null
  last_test_status: 'success' | 'failed' | null
  last_test_message: string | null
  created_at: string
  updated_at: string
}

type PrintableOrderRow = {
  id: string
  business_id: string
  table_id: string
  status: string
  notes: string | null
  total_amount: number
  created_at: string
  updated_at: string
  table?: {
    id?: string
    table_number?: string
    name?: string | null
  } | null
  order_items?: Array<{
    id: string
    product_name_snapshot_el: string
    product_name_snapshot_en: string | null
    unit_price: number
    quantity: number
    line_total: number
    order_item_options?: Array<{
      id: string
      option_group_name_el: string
      option_group_name_en: string | null
      option_choice_name_el: string
      option_choice_name_en: string | null
      price_delta: number
    }>
  }>
}

const SERVICE_REQUEST_PREFIX = '__SERVICE_REQUEST__:'

function normalizeCheckbox(value: FormDataEntryValue | null) {
  return value === 'on' || value === 'true' || value === '1'
}

function normalizeNullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  return text.length > 0 ? text : null
}

function normalizeInteger(
  value: FormDataEntryValue | null,
  fallback: number,
  min?: number,
  max?: number,
) {
  const parsed = Number(String(value ?? '').trim())

  if (!Number.isFinite(parsed)) return fallback

  let result = Math.trunc(parsed)

  if (typeof min === 'number' && result < min) result = min
  if (typeof max === 'number' && result > max) result = max

  return result
}

function getServiceRequestType(notes?: string | null) {
  if (!notes?.startsWith(SERVICE_REQUEST_PREFIX)) return null

  const value = notes.replace(SERVICE_REQUEST_PREFIX, '').trim()

  if (value === 'waiter' || value === 'bill') return value
  return null
}

async function resolveBusinessId() {
  const currentBusiness = await getCurrentBusiness()

  if (!currentBusiness.data?.id) {
    return { businessId: null as string | null, error: 'Δεν βρέθηκε επιχείρηση.' }
  }

  return { businessId: currentBusiness.data.id, error: null }
}

export async function getPrinterSettingsForBusiness(
  businessId?: string,
): Promise<ActionResult<PrinterSettingsRow | null>> {
  const admin = createAdminClient()

  let resolvedBusinessId = businessId

  if (!resolvedBusinessId) {
    const result = await resolveBusinessId()
    if (result.error || !result.businessId) {
      return { data: null, error: result.error ?? 'Δεν βρέθηκε επιχείρηση.' }
    }
    resolvedBusinessId = result.businessId
  }

  const { data, error } = await admin
    .from('printer_settings')
    .select('*')
    .eq('business_id', resolvedBusinessId)
    .eq('is_default', true)
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  return {
    data: (data ?? null) as PrinterSettingsRow | null,
    error: null,
  }
}

export async function upsertPrinterSettings(
  formData: FormData,
): Promise<ActionResult<PrinterSettingsRow>> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Δεν είστε συνδεδεμένος.' }
  }

  const result = await resolveBusinessId()

  if (result.error || !result.businessId) {
    return { data: null, error: result.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const businessId = result.businessId

  const printingMode = String(formData.get('printing_mode') ?? 'disabled') as PrintingMode

  const connectionType =
    printingMode === 'escpos_network'
      ? (String(formData.get('connection_type') ?? 'wifi') as 'wifi' | 'ethernet')
      : 'browser'

  const payload = {
    business_id: businessId,
    name: String(formData.get('name') ?? 'Main Printer').trim() || 'Main Printer',
    is_enabled: normalizeCheckbox(formData.get('is_enabled')),
    is_default: true,
    printing_mode: printingMode,
    connection_type: connectionType,
    printer_brand: normalizeNullableText(formData.get('printer_brand')),
    printer_model: normalizeNullableText(formData.get('printer_model')),
    printer_ip:
      printingMode === 'escpos_network'
        ? normalizeNullableText(formData.get('printer_ip'))
        : null,
    printer_port:
      printingMode === 'escpos_network'
        ? normalizeInteger(formData.get('printer_port'), 9100, 1, 65535)
        : null,
    paper_width: (String(formData.get('paper_width') ?? '80mm') === '58mm'
      ? '58mm'
      : '80mm') as '58mm' | '80mm',
    characters_per_line: normalizeInteger(
      formData.get('characters_per_line'),
      String(formData.get('paper_width') ?? '80mm') === '58mm' ? 32 : 48,
      24,
      64,
    ),
    auto_print_orders: normalizeCheckbox(formData.get('auto_print_orders')),
    auto_print_service_requests: normalizeCheckbox(
      formData.get('auto_print_service_requests'),
    ),
    auto_print_bills: normalizeCheckbox(formData.get('auto_print_bills')),
    copies_count: normalizeInteger(formData.get('copies_count'), 1, 1, 5),
    cut_paper: normalizeCheckbox(formData.get('cut_paper')),
    open_cash_drawer: normalizeCheckbox(formData.get('open_cash_drawer')),
    header_text: normalizeNullableText(formData.get('header_text')),
    footer_text: normalizeNullableText(formData.get('footer_text')),
    make_webhook_url:
      printingMode === 'make_printnode'
        ? normalizeNullableText(formData.get('make_webhook_url'))
        : null,
    printnode_printer_id:
      printingMode === 'make_printnode'
        ? normalizeNullableText(formData.get('printnode_printer_id'))
        : null,
  }

  const { data: existing, error: existingError } = await admin
    .from('printer_settings')
    .select('id')
    .eq('business_id', businessId)
    .eq('is_default', true)
    .maybeSingle()

  if (existingError) {
    return { data: null, error: existingError.message }
  }

  if (payload.printing_mode === 'escpos_network' && !payload.printer_ip) {
    return {
      data: null,
      error: 'Για network printer πρέπει να συμπληρώσετε IP εκτυπωτή.',
    }
  }

  if (payload.printing_mode === 'make_printnode' && !payload.make_webhook_url) {
    return {
      data: null,
      error: 'Για Make + PrintNode πρέπει να συμπληρώσετε Make webhook URL.',
    }
  }

  let saved
  let saveError

  if (existing?.id) {
    const response = await admin
      .from('printer_settings')
      .update(payload as never)
      .eq('id', existing.id)
      .select()
      .single()

    saved = response.data
    saveError = response.error
  } else {
    const response = await admin
      .from('printer_settings')
      .insert(payload as never)
      .select()
      .single()

    saved = response.data
    saveError = response.error
  }

  if (saveError) {
    return { data: null, error: saveError.message }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')

  return { data: saved as PrinterSettingsRow, error: null }
}

export async function testPrinterSettings(): Promise<ActionResult> {
  const admin = createAdminClient()

  const result = await resolveBusinessId()

  if (result.error || !result.businessId) {
    return { data: null, error: result.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const businessId = result.businessId

  const { data: current, error: currentError } = await admin
    .from('printer_settings')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_default', true)
    .maybeSingle()

  if (currentError) {
    return { data: null, error: currentError.message }
  }

  if (!current) {
    return { data: null, error: 'Δεν υπάρχουν αποθηκευμένες ρυθμίσεις εκτυπωτή.' }
  }

  if (!current.is_enabled) {
    return {
      data: null,
      error: 'Ο εκτυπωτής είναι απενεργοποιημένος. Ενεργοποιήστε τον πρώτα.',
    }
  }

  if (current.printing_mode === 'disabled') {
    return {
      data: null,
      error: 'Το printing mode είναι Disabled.',
    }
  }

  let status: 'success' | 'failed' = 'success'
  let message = 'Το test εκτύπωσης ολοκληρώθηκε.'

  if (current.printing_mode === 'escpos_network') {
    if (!current.printer_ip) {
      status = 'failed'
      message = 'Λείπει η IP του network printer.'
    } else {
      message =
        'Οι ρυθμίσεις network printer αποθηκεύτηκαν. Το πραγματικό socket print θα συνδεθεί σε επόμενο βήμα.'
    }
  }

  if (current.printing_mode === 'browser') {
    message =
      'Το browser print mode είναι αποθηκευμένο. Το πραγματικό browser print flow θα συνδεθεί σε επόμενο βήμα.'
  }

  if (current.printing_mode === 'make_printnode') {
    if (!current.make_webhook_url) {
      status = 'failed'
      message = 'Λείπει το Make webhook URL.'
    } else {
      const { data: business, error: businessError } = await admin
        .from('businesses')
        .select('id, name, slug, currency')
        .eq('id', businessId)
        .single()

      if (businessError || !business) {
        status = 'failed'
        message = businessError?.message ?? 'Η επιχείρηση δεν βρέθηκε.'
      } else {
        const testPayload = {
          source: 'tableorder',
          event_type: 'test_print',
          sent_at: new Date().toISOString(),
          business: {
            id: business.id,
            name: business.name,
            slug: business.slug,
            currency: business.currency,
          },
          printer_settings: {
            id: current.id,
            name: current.name,
            mode: current.printing_mode,
            paper_width: current.paper_width,
            characters_per_line: current.characters_per_line,
            copies_count: current.copies_count,
            cut_paper: current.cut_paper,
            open_cash_drawer: current.open_cash_drawer,
            header_text: current.header_text,
            footer_text: current.footer_text,
            printnode_printer_id: current.printnode_printer_id,
          },
          test_print: {
            title: 'TEST PRINT',
            created_at: new Date().toISOString(),
            message: 'This is a printer test from TableOrder.',
          },
          table: {
            id: 'test-table',
            table_number: 'TEST',
            name: 'Printer Settings',
          },
          order: {
            id: 'test-print',
            status: 'test',
            notes: 'Printer test',
            total_amount: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            service_request_type: null,
          },
          items: [
            {
              id: 'test-item-1',
              name_el: 'Δοκιμαστική Εκτύπωση',
              name_en: 'Test Print',
              unit_price: 0,
              quantity: 1,
              line_total: 0,
              options: [],
            },
          ],
        }

        try {
          const response = await fetch(current.make_webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload),
            cache: 'no-store',
          })

          if (!response.ok) {
            status = 'failed'
            const responseText = await response.text()
            message = `Webhook error ${response.status}: ${responseText}`
          } else {
            message = 'Στάλθηκε δοκιμαστική εκτύπωση στο Make webhook.'
          }
        } catch (error) {
          status = 'failed'
          message =
            error instanceof Error ? error.message : 'Άγνωστο σφάλμα webhook.'
        }
      }
    }
  }

  const { error } = await admin
    .from('printer_settings')
    .update({
      last_tested_at: new Date().toISOString(),
      last_test_status: status,
      last_test_message: message,
    } as never)
    .eq('id', current.id)

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { data: null, error: status === 'failed' ? message : null }
}

async function getPrintableOrder(orderId: string): Promise<ActionResult<PrintableOrderRow>> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('orders')
    .select(`
      *,
      table:tables (
        id,
        table_number,
        name
      ),
      order_items (
        id,
        product_name_snapshot_el,
        product_name_snapshot_en,
        unit_price,
        quantity,
        line_total,
        order_item_options (
          id,
          option_group_name_el,
          option_group_name_en,
          option_choice_name_el,
          option_choice_name_en,
          price_delta
        )
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !data) {
    return {
      data: null,
      error: error?.message ?? 'Η παραγγελία δεν βρέθηκε για εκτύπωση.',
    }
  }

  return {
    data: data as unknown as PrintableOrderRow,
    error: null,
  }
}

export async function triggerAutomaticPrintForOrder(
  orderId: string,
): Promise<ActionResult<{ sent: boolean; skipped: boolean }>> {
  const admin = createAdminClient()

  const orderResult = await getPrintableOrder(orderId)

  if (orderResult.error || !orderResult.data) {
    return {
      data: { sent: false, skipped: true },
      error: orderResult.error ?? 'Η παραγγελία δεν βρέθηκε.',
    }
  }

  const order = orderResult.data
  const serviceRequestType = getServiceRequestType(order.notes)

  const settingsResult = await getPrinterSettingsForBusiness(order.business_id)

  if (settingsResult.error) {
    return {
      data: { sent: false, skipped: true },
      error: settingsResult.error,
    }
  }

  const settings = settingsResult.data

  if (!settings || !settings.is_enabled) {
    return { data: { sent: false, skipped: true }, error: null }
  }

  if (settings.printing_mode !== 'make_printnode') {
    return { data: { sent: false, skipped: true }, error: null }
  }

  if (!settings.make_webhook_url) {
    return {
      data: { sent: false, skipped: true },
      error: 'Δεν υπάρχει Make webhook URL στα printer settings.',
    }
  }

  const shouldPrint =
    serviceRequestType === 'waiter'
      ? settings.auto_print_service_requests
      : serviceRequestType === 'bill'
        ? settings.auto_print_bills
        : settings.auto_print_orders

  if (!shouldPrint) {
    return { data: { sent: false, skipped: true }, error: null }
  }

  const { data: business, error: businessError } = await admin
    .from('businesses')
    .select('id, name, slug, currency')
    .eq('id', order.business_id)
    .single()

  if (businessError || !business) {
    return {
      data: { sent: false, skipped: true },
      error: businessError?.message ?? 'Η επιχείρηση δεν βρέθηκε.',
    }
  }

  const payload = {
    source: 'tableorder',
    event_type: serviceRequestType
      ? `service_request_${serviceRequestType}`
      : 'order_created',
    sent_at: new Date().toISOString(),
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      currency: business.currency,
    },
    printer_settings: {
      id: settings.id,
      name: settings.name,
      mode: settings.printing_mode,
      paper_width: settings.paper_width,
      characters_per_line: settings.characters_per_line,
      copies_count: settings.copies_count,
      cut_paper: settings.cut_paper,
      open_cash_drawer: settings.open_cash_drawer,
      header_text: settings.header_text,
      footer_text: settings.footer_text,
      printnode_printer_id: settings.printnode_printer_id,
    },
    order: {
      id: order.id,
      status: order.status,
      notes: order.notes,
      total_amount: order.total_amount,
      created_at: order.created_at,
      updated_at: order.updated_at,
      service_request_type: serviceRequestType,
    },
    table: {
      id: order.table?.id ?? order.table_id,
      table_number: order.table?.table_number ?? '',
      name: order.table?.name ?? null,
    },
    items: (order.order_items ?? []).map((item) => ({
      id: item.id,
      name_el: item.product_name_snapshot_el,
      name_en: item.product_name_snapshot_en,
      unit_price: item.unit_price,
      quantity: item.quantity,
      line_total: item.line_total,
      options: (item.order_item_options ?? []).map((option) => ({
        id: option.id,
        group_name_el: option.option_group_name_el,
        group_name_en: option.option_group_name_en,
        choice_name_el: option.option_choice_name_el,
        choice_name_en: option.option_choice_name_en,
        price_delta: option.price_delta,
      })),
    })),
  }

  try {
    const response = await fetch(settings.make_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (!response.ok) {
      const responseText = await response.text()

      return {
        data: { sent: false, skipped: false },
        error: `Webhook error ${response.status}: ${responseText}`,
      }
    }

    return {
      data: { sent: true, skipped: false },
      error: null,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Άγνωστο σφάλμα webhook.'

    return {
      data: { sent: false, skipped: false },
      error: message,
    }
  }
}