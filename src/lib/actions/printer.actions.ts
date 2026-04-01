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

  let status: 'success' | 'failed' = 'success'
  let message = 'Το test αποθηκεύτηκε επιτυχώς.'

  if (current.printing_mode === 'escpos_network') {
    if (!current.printer_ip) {
      status = 'failed'
      message = 'Λείπει η IP του network printer.'
    } else {
      message =
        'Οι ρυθμίσεις network printer αποθηκεύτηκαν. Το πραγματικό socket print θα συνδεθεί στο επόμενο βήμα.'
    }
  }

  if (current.printing_mode === 'browser') {
    message =
      'Το browser print mode είναι αποθηκευμένο. Το πραγματικό print flow θα προστεθεί στο επόμενο βήμα.'
  }

  if (current.printing_mode === 'make_printnode') {
    if (!current.make_webhook_url) {
      status = 'failed'
      message = 'Λείπει το Make webhook URL.'
    } else {
      message =
        'Το Make + PrintNode mode είναι αποθηκευμένο. Στο επόμενο βήμα θα στείλουμε πραγματικό webhook.'
    }
  }

  if (current.printing_mode === 'disabled') {
    message = 'Ο εκτυπωτής είναι απενεργοποιημένος.'
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
  return { data: null, error: null }
}