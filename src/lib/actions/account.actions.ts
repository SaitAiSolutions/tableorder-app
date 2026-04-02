'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface ActionResult {
  error: string | null
}

export async function updateAccountEmail(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Δεν βρέθηκε ενεργός χρήστης.' }
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email) {
    return { error: 'Συμπληρώστε νέο email.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return { error: 'Το email δεν είναι έγκυρο.' }
  }

  if ((user.email ?? '').trim().toLowerCase() === email) {
    return { error: 'Το νέο email είναι ίδιο με το τρέχον.' }
  }

  const { error } = await supabase.auth.updateUser({
    email,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')

  return { error: null }
}