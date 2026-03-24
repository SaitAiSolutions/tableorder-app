'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signUp } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

const initialState = { error: null as string | null }

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUp, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">TableOrder</h1>
          <p className="mt-1 text-sm text-gray-500">Δημιουργία λογαριασμού επιχείρησης</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <form action={action} className="flex flex-col gap-5">
            <ErrorMessage message={state.error} />

            <Field label="Ονοματεπώνυμο" htmlFor="full_name" required>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                placeholder="Γιάννης Παπαδόπουλος"
                required
              />
            </Field>

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

            <Field label="Κωδικός" htmlFor="password" required>
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

            <Button type="submit" loading={pending} className="w-full">
              Δημιουργία λογαριασμού
            </Button>

            <p className="text-center text-xs text-gray-500">
              Συνεχίζοντας, αποδέχεστε τους Όρους Χρήσης.
            </p>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Έχετε ήδη λογαριασμό;{' '}
          <Link
            href="/auth/login"
            className="font-medium text-gray-900 hover:underline"
          >
            Σύνδεση
          </Link>
        </p>
      </div>
    </div>
  )
}