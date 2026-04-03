'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Wand2 } from 'lucide-react'

interface StarterMenuActionsProps {
  onCreateCoffeeBarMenu: (formData: FormData) => void | Promise<void>
  onCreateSnackBarMenu: (formData: FormData) => void | Promise<void>
  onAutoTranslateMenu: (formData: FormData) => void | Promise<void>
}

export function StarterMenuActions({
  onCreateCoffeeBarMenu,
  onCreateSnackBarMenu,
  onAutoTranslateMenu,
}: StarterMenuActionsProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] shadow-sm transition hover:bg-[#f8f3ee]"
      >
        <Wand2 className="h-4 w-4" />
        Starter menu
        <ChevronDown
          className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-3 w-[320px] overflow-hidden rounded-[24px] border border-[#ebe5dd] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="mb-2 px-2 pt-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Starter actions
            </p>
            <p className="mt-1 text-sm text-[#7b6657]">
              Χρησιμοποίησέ το μόνο αν θέλεις να γεμίσεις αυτόματα το μενού.
            </p>
          </div>

          <div className="space-y-2">
            <form
              action={async (formData) => {
                setOpen(false)
                await onCreateCoffeeBarMenu(formData)
              }}
            >
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1f2937] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#111827]"
              >
                Starter menu για coffee bar
              </button>
            </form>

            <form
              action={async (formData) => {
                setOpen(false)
                await onCreateSnackBarMenu(formData)
              }}
            >
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-4 py-3 text-sm font-semibold text-[#5f5146] transition hover:bg-[#f8f3ee]"
              >
                Starter menu για snack bar
              </button>
            </form>

            <form
              action={async (formData) => {
                setOpen(false)
                await onAutoTranslateMenu(formData)
              }}
            >
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-4 py-3 text-sm font-semibold text-[#5f5146] transition hover:bg-[#f8f3ee]"
              >
                Αυτόματη μετάφραση menu στα Αγγλικά
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}