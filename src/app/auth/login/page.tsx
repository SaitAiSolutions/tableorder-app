'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signIn } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

const initialState = { error: null as string | null }

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">TableOrder</h1>
          <p className="mt-1 text-sm text-gray-500">Σύνδεση στο λογαριασμό σας</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
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

            <Field label="Κωδικός" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </Field>

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Ξέχασα τον κωδικό
              </Link>
            </div>

            <Button type="submit" loading={pending} className="w-full">
              Σύνδεση
            </Button>
          </form>
        </div>

        <div className="mt-4 rounded-xl border border-[#e8ddd2] bg-white p-4 text-center shadow-sm">
          <p className="text-sm text-[#6f6156]">Θέλετε πρώτα να δείτε πώς λειτουργεί;</p>
          <Link
            href="/demo"
            className="mt-3 inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
          >
            Δες demo
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Δεν έχετε λογαριασμό;{' '}
          <Link
            href="/auth/signup"
            className="font-medium text-gray-900 hover:underline"
          >
            Εγγραφή
          </Link>
        </p>
      </div>
    </div>
  )
}