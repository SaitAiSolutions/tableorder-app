import Link from 'next/link'
import { Button } from '@/components/ui/button'

const demoMenuUrl = process.env.NEXT_PUBLIC_DEMO_MENU_URL || '#'
const demoDashboardUrl = process.env.NEXT_PUBLIC_DEMO_DASHBOARD_URL || '/auth/login'

const demoConfigured =
  demoMenuUrl !== '#' && demoDashboardUrl !== '#'

const demoSteps = [
  {
    title: 'Customer menu demo',
    description:
      'Δείτε πώς ο πελάτης σκανάρει QR, βλέπει το menu και στέλνει παραγγελία από το κινητό.',
  },
  {
    title: 'Dashboard demo',
    description:
      'Δείτε πώς η παραγγελία εμφανίζεται ζωντανά στην επιχείρηση, μαζί με τραπέζια, status και service requests.',
  },
  {
    title: 'Real business flow',
    description:
      'Το ίδιο flow μπορεί να στηθεί στο δικό σας κατάστημα με το δικό σας menu και τα δικά σας τραπέζια.',
  },
]

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#f6f3ee] text-gray-900">
      <section className="border-b border-[#e7ddd3] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex rounded-full bg-[#f3ece4] px-4 py-1.5 text-sm font-medium text-[#7b6657]">
                Live demo
              </p>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                Δες το TableOrder στην πράξη
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6f6156]">
                Μπες σε έτοιμο demo περιβάλλον και δες τόσο την εμπειρία του πελάτη
                από το QR menu, όσο και τη μεριά του καταστήματος μέσα από το dashboard.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a href={demoMenuUrl}>
                  <Button
                    className="rounded-2xl bg-[#1f2937] px-6 py-6 text-base text-white hover:bg-[#111827]"
                    disabled={!demoConfigured}
                  >
                    Άνοιγμα customer demo
                  </Button>
                </a>

                <a href={demoDashboardUrl}>
                  <Button
                    variant="ghost"
                    className="rounded-2xl border border-[#d8cdc1] bg-white px-6 py-6 text-base text-[#5f5146] hover:bg-[#f8f3ee]"
                    disabled={!demoConfigured}
                  >
                    Άνοιγμα dashboard demo
                  </Button>
                </a>

                <Link href="/auth/signup">
                  <Button
                    variant="ghost"
                    className="rounded-2xl border border-[#d8cdc1] bg-white px-6 py-6 text-base text-[#5f5146] hover:bg-[#f8f3ee]"
                  >
                    Ξεκίνα δωρεάν
                  </Button>
                </Link>
              </div>

              {!demoConfigured ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Το demo δεν έχει ρυθμιστεί ακόμα. Βάλτε τα env variables
                  <span className="mx-1 font-semibold">NEXT_PUBLIC_DEMO_MENU_URL</span>
                  και
                  <span className="mx-1 font-semibold">NEXT_PUBLIC_DEMO_DASHBOARD_URL</span>.
                </div>
              ) : null}
            </div>

            <div className="rounded-[32px] border border-[#e7ddd3] bg-gradient-to-br from-[#1f2937] via-[#2c3645] to-[#8a674f] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/80">
                Demo flow
              </p>

              <div className="mt-5 space-y-4">
                {demoSteps.map((step, index) => (
                  <div key={step.title} className="rounded-2xl bg-white/10 p-4">
                    <p className="text-base font-semibold">
                      {index + 1}. {step.title}
                    </p>
                    <p className="mt-1 text-sm text-white/80">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[28px] border border-[#e7ddd3] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <h3 className="text-xl font-semibold tracking-tight text-gray-900">
              Χωρίς app
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#6f6156]">
              Ο πελάτης απλά σκανάρει το QR και παραγγέλνει από browser.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#e7ddd3] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <h3 className="text-xl font-semibold tracking-tight text-gray-900">
              Ζωντανή διαχείριση
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#6f6156]">
              Το κατάστημα βλέπει live orders, status, τραπέζια και service requests.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#e7ddd3] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <h3 className="text-xl font-semibold tracking-tight text-gray-900">
              Έτοιμο για χρήση
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#6f6156]">
              Στήνεται γρήγορα με το δικό σας menu, τα δικά σας τραπέζια και τα δικά σας QR.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}