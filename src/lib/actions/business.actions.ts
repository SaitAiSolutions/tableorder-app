// Path: src/lib/actions/business.actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Business, UpdateBusiness } from '@/types/database.types'

interface ActionResult<T = null> {
  data: T | null
  error: string | null
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

  const { data: business, error: bizError } = await admin
    .from('businesses')
    .insert({
      name,
      slug,
      currency,
      default_language: 'el',
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