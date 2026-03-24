'use client'

interface OrderConfirmationProps {
  open: boolean
  onClose: () => void
}

export function OrderConfirmation({ open, onClose }: OrderConfirmationProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111827]/35 px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        <div className="bg-gradient-to-r from-[#1f2937] via-[#2b3442] to-[#7c5c46] px-6 py-6 text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h3 className="mt-4 text-center text-2xl font-semibold tracking-tight">
            Η παραγγελία στάλθηκε
          </h3>
          <p className="mt-2 text-center text-sm leading-6 text-white/80">
            Ευχαριστούμε. Η παραγγελία σας καταχωρήθηκε επιτυχώς και θα τη δει άμεσα το προσωπικό.
          </p>
        </div>

        <div className="px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-[#1f2937] px-4 py-3 text-sm font-medium text-white shadow-[0_10px_24px_rgba(31,41,55,0.18)] transition hover:bg-[#111827]"
          >
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  )
}