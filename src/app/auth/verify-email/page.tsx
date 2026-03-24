import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Επιβεβαίωση email' }

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Ελέγξτε το email σας</h1>
        <p className="mt-3 text-sm text-gray-600">
          Σας στείλαμε σύνδεσμο επιβεβαίωσης. Κάντε κλικ για να ενεργοποιήσετε τον λογαριασμό σας.
        </p>
        <p className="mt-2 text-xs text-gray-400">Ελέγξτε και τον φάκελο spam αν δεν το βλέπετε.</p>
        <Link
          href="/auth/login"
          className="mt-8 inline-block text-sm font-medium text-gray-900 hover:underline"
        >
          ← Επιστροφή στη σύνδεση
        </Link>
      </div>
    </div>
  )
}