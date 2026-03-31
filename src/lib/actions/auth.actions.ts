'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdminEmail } from '@/lib/utils/admin'

interface ActionResult {
  error: string | null
}

async function getUserBusinessCount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return 0

  const { count } = await supabase
    .from('business_users')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return count ?? 0
}

// ---------------------------------------------------------------------------
// signUp
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appUrl) {
    return { error: 'Λείπει το NEXT_PUBLIC_APP_URL από τα environment variables.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo: `${appUrl}/auth/login`,
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
// Super admin emails always go to /admin.
// Normal users with at least one business go to /dashboard.
// Normal users without business go to /onboarding.
// ---------------------------------------------------------------------------
export async function signIn(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim().toLowerCase()
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

  if (isSuperAdminEmail(email)) {
    redirect('/admin')
  }

  const businessCount = await getUserBusinessCount()

  if (businessCount > 0) {
    redirect('/dashboard')
  }

  redirect('/onboarding')
}

// ---------------------------------------------------------------------------
// signOut
// Clears session and admin business selection cookie.
// ---------------------------------------------------------------------------
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  const cookieStore = await cookies()

  await supabase.auth.signOut()
  cookieStore.delete('admin_business_id')

  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

// ---------------------------------------------------------------------------
// forgotPassword
// ---------------------------------------------------------------------------
export async function forgotPassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return { error: 'Παρακαλώ εισάγετε το email σας.' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appUrl) {
    return { error: 'Λείπει το NEXT_PUBLIC_APP_URL από τα environment variables.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/reset-password`,
  })

  if (error) {
    console.error('[forgotPassword]', error.message)

    if (error.message.toLowerCase().includes('email rate limit exceeded')) {
      return {
        error:
          'Έγιναν πολλές προσπάθειες αποστολής email. Περιμένετε λίγο και δοκιμάστε ξανά.',
      }
    }

    return { error: 'Δεν ήταν δυνατή η αποστολή email επαναφοράς αυτή τη στιγμή.' }
  }

  return { error: null }
}

// ---------------------------------------------------------------------------
// updatePassword
// After password reset, send super admins to /admin and others based on whether
// they already belong to a business.
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  revalidatePath('/', 'layout')

  if (isSuperAdminEmail(user?.email)) {
    redirect('/admin')
  }

  const businessCount = await getUserBusinessCount()

  if (businessCount > 0) {
    redirect('/dashboard')
  }

  redirect('/onboarding')
}