'use client'

import { useEffect, useMemo, useState, useActionState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updatePassword } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

const initialState = { error: null as string | null }

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const [confirmValue, setConfirmValue] = useState('')
  const [state, action, pending] = useActionState(updatePassword, initialState)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function initRecovery() {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            if (mounted) {
              setLinkError('Ο σύνδεσμος επαναφοράς δεν είναι έγκυρος ή έχει λήξει.')
              setReady(false)
            }
            return
          }

          if (mounted) {
            setReady(true)
            setLinkError(null)
          }
          return
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          if (mounted) {
            setReady(true)
            setLinkError(null)
          }
          return
        }

        if (mounted) {
          setLinkError('Ο σύνδεσμος επαναφοράς δεν είναι έγκυρος ή έχει λήξει.')
          setReady(false)
        }
      } catch {
        if (mounted) {
          setLinkError('Παρουσιάστηκε πρόβλημα στην επαλήθευση του συνδέσμου.')
          setReady(false)
        }
      }
    }

    initRecovery()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true)
        setLinkError(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!pending && submitted && state.error !== null) {
      setSubmitted(false)
    }
  }, [pending, submitted, state.error])

  const success = submitted && !pending && state.error === null

  const passwordsMismatch = useMemo(() => {
    if (!passwordValue || !confirmValue) return false
    return passwordValue !== confirmValue
  }, [passwordValue, confirmValue])

  const passwordTooShort = useMemo(() => {
    if (!passwordValue) return false
    return passwordValue.length < 8
  }, [passwordValue])

  if (linkError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900">
              Μη έγκυρος σύνδεσμος
            </h1>

            <p className="mt-3 text-sm text-gray-600">{linkError}</p>

            <a
              href="/auth/forgot-password"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
            >
              Ζήτησε νέο email επαναφοράς
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-6 w-6 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-gray-500">Επαλήθευση συνδέσμου…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Νέος κωδικός</h1>
          <p className="mt-1 text-sm text-gray-500">
            Επιλέξτε έναν νέο κωδικό για τον λογαριασμό σας
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <form
            action={(formData) => {
              if (passwordValue !== confirmValue || passwordValue.length < 8) {
                return
              }

              setSubmitted(true)
              return action(formData)
            }}
            className="flex flex-col gap-5"
          >
            <ErrorMessage message={state.error} />

            {success ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Ο κωδικός αποθηκεύτηκε επιτυχώς.
              </div>
            ) : null}

            <Field label="Νέος κωδικός" htmlFor="password" required>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Τουλάχιστον 8 χαρακτήρες"
                  minLength={8}
                  required
                  className="pr-12"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 hover:text-gray-700"
                  aria-label={showPassword ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </Field>

            <Field label="Επιβεβαίωση κωδικού" htmlFor="confirm" required>
              <div className="relative">
                <Input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Επαναλάβετε τον κωδικό"
                  minLength={8}
                  required
                  className="pr-12"
                  value={confirmValue}
                  onChange={(e) => setConfirmValue(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 hover:text-gray-700"
                  aria-label={showConfirm ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </Field>

            {passwordTooShort ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.
              </div>
            ) : null}

            {passwordsMismatch ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Οι δύο κωδικοί δεν ταιριάζουν.
              </div>
            ) : null}

            <Button
              type="submit"
              loading={pending}
              className="w-full"
              disabled={passwordTooShort || passwordsMismatch}
            >
              Αποθήκευση νέου κωδικού
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}