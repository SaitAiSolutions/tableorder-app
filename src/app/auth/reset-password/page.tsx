'use client'

import { useEffect, useState, useActionState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updatePassword } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

const initialState = { error: null as string | null }

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [state, action, pending] = useActionState(updatePassword, initialState)

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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
          <form action={action} className="flex flex-col gap-5">
            <ErrorMessage message={state.error} />

            <Field label="Νέος κωδικός" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Τουλάχιστον 8 χαρακτήρες"
                minLength={8}
                required
              />
            </Field>

            <Field label="Επιβεβαίωση κωδικού" htmlFor="confirm" required>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Επαναλάβετε τον κωδικό"
                minLength={8}
                required
              />
            </Field>

            <Button type="submit" loading={pending} className="w-full">
              Αποθήκευση νέου κωδικού
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}