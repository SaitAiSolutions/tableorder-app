// Path: src/lib/actions/auth.actions.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface ActionResult {
  error: string | null
}

// ---------------------------------------------------------------------------
// signUp
// Creates a new Supabase auth user. If email confirmation is enabled in the
// Supabase dashboard, the user receives a confirmation email and is redirected
// to /auth/verify-email. The handle_new_user DB trigger automatically creates
// a profiles row when confirmation is complete.
// ---------------------------------------------------------------------------
export async function signUp(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string

  if (!email || !password || !full_name) {
    return { error: 'Παρακαλώ συμπληρώστε όλα τα πεδία.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Αυτό το email χρησιμοποιείται ήδη.' }
    }
    return { error: error.message }
  }

  redirect('/auth/verify-email')
}

// ---------------------------------------------------------------------------
// signIn
// ---------------------------------------------------------------------------
export async function signIn(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Παρακαλώ συμπληρώστε email και κωδικό.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Λάθος email ή κωδικός.' }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

// ---------------------------------------------------------------------------
// forgotPassword
// Sends a password reset email. Always returns success to avoid revealing
// which email addresses are registered.
// ---------------------------------------------------------------------------
export async function forgotPassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  if (!email) {
    return { error: 'Παρακαλώ εισάγετε το email σας.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  })

  if (error) {
    console.error('[forgotPassword]', error.message)
  }

  return { error: null }
}

// ---------------------------------------------------------------------------
// updatePassword
// Called from /auth/reset-password after the browser Supabase client has
// exchanged the recovery token for a session (via onAuthStateChange /
// PASSWORD_RECOVERY event). By the time this server action runs, the user
// already has a valid session cookie.
// ---------------------------------------------------------------------------
export async function updatePassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!password || password.length < 8) {
    return { error: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.' }
  }
  if (password !== confirm) {
    return { error: 'Οι κωδικοί δεν ταιριάζουν.' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}