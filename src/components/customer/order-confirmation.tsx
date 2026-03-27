'use client'

import { CheckCircle2, UtensilsCrossed } from 'lucide-react'

interface OrderConfirmationProps {
  open: boolean
  onClose: () => void
}

export function OrderConfirmation({ open, onClose }: OrderConfirmationProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#111827]/40 px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        <div className="bg-gradient-to-r from-[#1f2937] via-[#2b3442] to-[#7c5c46] px-6 py-6 text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>

          <h3 className="mt-4 text-center text-2xl font-semibold tracking-tight">
            Η παραγγελία στάλθηκε
          </h3>
          <p className="mt-2 text-center text-sm leading-6 text-white/80">
            Ευχαριστούμε. Η παραγγελία σας καταχωρήθηκε επιτυχώς και θα τη δει άμεσα το προσωπικό.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-[22px] border border-[#eadfd3] bg-[#fcfaf7] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6efe8] text-[#7c5c46]">
                <UtensilsCrossed className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Τι γίνεται τώρα;
                </p>
                <p className="mt-1 text-sm leading-6 text-[#7b6657]">
                  Μπορείτε να συνεχίσετε να βλέπετε το menu και να στείλετε νέα παραγγελία
                  αργότερα, αν χρειαστεί.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-[#1f2937] px-4 py-3 text-sm font-medium text-white shadow-[0_10px_24px_rgba(31,41,55,0.18)] transition hover:bg-[#111827]"
          >
            Συνέχεια στο menu
          </button>
        </div>
      </div>
    </div>
  )
}