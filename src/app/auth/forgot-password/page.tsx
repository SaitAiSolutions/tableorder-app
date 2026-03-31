'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { forgotPassword } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

const initialState = { error: null as string | null }

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, initialState)
  const sent = !pending && state.error === null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Επαναφορά κωδικού</h1>
          <p className="mt-1 text-sm text-gray-500">
            Θα σας στείλουμε σύνδεσμο για επαναφορά κωδικού
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-700">
                Αν το email υπάρχει στο σύστημα, θα λάβετε σύνδεσμο επαναφοράς σε λίγα λεπτά.
              </p>
              <p className="mt-2 text-xs text-gray-500">Ελέγξτε και τον φάκελο spam.</p>
            </div>
          ) : (
            <form action={action} className="flex flex-col gap-5">
              <ErrorMessage message={state.error} />

              <Field label="Email" htmlFor="email" required>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </Field>

              <Button type="submit" loading={pending} className="w-full">
                Αποστολή συνδέσμου
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/auth/login" className="font-medium text-gray-900 hover:underline">
            ← Επιστροφή στη σύνδεση
          </Link>
        </p>
      </div>
    </div>
  )
}