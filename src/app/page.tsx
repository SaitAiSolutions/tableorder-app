import Link from 'next/link'
import Image from 'next/image'

const features = [
  {
    title: 'QR menu ανά τραπέζι',
    description:
      'Κάθε τραπέζι έχει το δικό του link και QR code ώστε ο πελάτης να ανοίγει αμέσως το σωστό μενού.',
  },
  {
    title: 'Live παραγγελίες',
    description:
      'Οι παραγγελίες εμφανίζονται στο dashboard σε πραγματικό χρόνο για άμεση διαχείριση από το προσωπικό.',
  },
  {
    title: 'Προϊόντα με επιλογές',
    description:
      'Υποστήριξη για έξτρα επιλογές όπως ζάχαρη, μέγεθος, γάλα, toppings και ό,τι άλλο χρειάζεται το κατάστημά σας.',
  },
  {
    title: 'Διαχείριση τραπεζιών',
    description:
      'Δείτε ποια τραπέζια είναι κατειλημμένα, καθαρίστε συνεδρίες και οργανώστε καλύτερα τη ροή του καταστήματος.',
  },
  {
    title: 'Εύκολο στήσιμο',
    description:
      'Φτιάχνετε κατηγορίες, προϊόντα, τιμές και QR χωρίς τεχνικές γνώσεις ή εγκατάσταση εφαρμογής.',
  },
  {
    title: 'Δωρεάν δοκιμή 14 ημερών',
    description:
      'Ο κάθε επαγγελματίας μπορεί να δοκιμάσει το σύστημα χωρίς δέσμευση πριν αποφασίσει αν του ταιριάζει.',
  },
]

const steps = [
  'Κάνετε εγγραφή και δημιουργείτε το κατάστημά σας.',
  'Προσθέτετε κατηγορίες, προϊόντα, τιμές και επιλογές.',
  'Δημιουργείτε τραπέζια και QR codes.',
  'Οι πελάτες σκανάρουν το QR και στέλνουν παραγγελία.',
  'Το προσωπικό βλέπει και διαχειρίζεται τα πάντα από το dashboard.',
]

const audiences = [
  'Καφετέριες',
  'Beach bars',
  'Snack bars',
  'Εστιατόρια',
  'All day καταστήματα',
  'Χώροι εστίασης με τραπέζια',
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f3ee] text-gray-900">
      <section className="border-b border-[#e9e0d6] bg-gradient-to-br from-[#1f2937] via-[#2b3442] to-[#7c5c46] text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
                QR Ordering Platform
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                QR Menu & Παραγγελιοληψία για καφέ, bar και εστιατόρια
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
                Οι πελάτες σκανάρουν το QR από το τραπέζι τους, βλέπουν το μενού,
                επιλέγουν προϊόντα και στέλνουν παραγγελία από το κινητό. Το
                προσωπικό τη διαχειρίζεται live από ένα εύχρηστο dashboard.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-[#1f2937] transition hover:bg-[#f5efe7]"
                >
                  Δωρεάν δοκιμή 14 ημερών
                </Link>

                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Δες πώς δουλεύει
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/75">
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  Χωρίς app install
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  Live dashboard
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  QR ανά τραπέζι
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur">
                <div className="overflow-hidden rounded-[22px] bg-white">
                  <div className="border-b border-[#eee5dc] bg-[#faf7f2] px-5 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      Live Dashboard Preview
                    </p>
                  </div>

                  <div className="p-4">
                    <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            Τραπέζι 4 · Βεράντα
                          </p>
                          <p className="mt-1 text-sm text-[#7b6657]">
                            Νέα παραγγελία
                          </p>
                        </div>

                        <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-medium text-[#245b9a]">
                          Νέα
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="rounded-2xl border border-[#f0e8df] bg-[#faf7f2] px-4 py-3 text-sm">
                          2x Freddo Cappuccino
                        </div>
                        <div className="rounded-2xl border border-[#f0e8df] bg-[#faf7f2] px-4 py-3 text-sm">
                          1x Cheesecake
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-lg font-semibold text-gray-900">
                          Σύνολο: 13,90 €
                        </p>
                        <button className="rounded-xl bg-[#1f2937] px-4 py-2 text-sm font-semibold text-white">
                          Αποδοχή
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[22px] border border-[#ebe5dd] bg-[#faf7f2] p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-[#8b715d]">
                          Customer menu
                        </p>
                        <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-[#efe7dd]" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                Freddo Espresso
                              </p>
                              <p className="text-xs text-[#7b6657]">3,80 €</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-[#ebe5dd] bg-[#faf7f2] p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-[#8b715d]">
                          QR ordering
                        </p>
                        <div className="mt-3 flex items-center justify-center rounded-2xl bg-white p-6 shadow-sm">
                          <div className="grid grid-cols-6 gap-1">
                            {Array.from({ length: 36 }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-3 w-3 rounded-[2px] ${
                                  i % 2 === 0 || i % 5 === 0
                                    ? 'bg-[#1f2937]'
                                    : 'bg-[#e7ddd3]'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              Πώς λειτουργεί
            </h2>
            <p className="mt-4 text-base leading-7 text-[#7b6657]">
              Το σύστημα έχει σχεδιαστεί ώστε να στήνεται γρήγορα και να
              χρησιμοποιείται εύκολα από το προσωπικό και τους πελάτες.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f2937] text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-900">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e9e0d6] bg-[#fbf8f4] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              Τι προσφέρει το σύστημα
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <h3 className="text-xl font-semibold tracking-tight text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#7b6657]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
                Screenshots
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                Δείξε στον πελάτη ακριβώς τι θα πάρει
              </h2>
              <p className="mt-4 text-base leading-7 text-[#7b6657]">
                Στην ενότητα αυτή αργότερα μπορείς να βάλεις πραγματικά
                screenshots από το dashboard, το customer menu και το QR flow.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="aspect-[4/3] rounded-2xl bg-[#f3ede5]" />
                  <p className="mt-3 text-sm font-medium text-gray-900">
                    Dashboard παραγγελιών
                  </p>
                </div>

                <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="aspect-[4/3] rounded-2xl bg-[#f3ede5]" />
                  <p className="mt-3 text-sm font-medium text-gray-900">
                    Customer menu στο κινητό
                  </p>
                </div>

                <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="aspect-[4/3] rounded-2xl bg-[#f3ede5]" />
                  <p className="mt-3 text-sm font-medium text-gray-900">
                    Διαχείριση προϊόντων
                  </p>
                </div>

                <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="aspect-[4/3] rounded-2xl bg-[#f3ede5]" />
                  <p className="mt-3 text-sm font-medium text-gray-900">
                    QR ανά τραπέζι
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#ebe5dd] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
                Ideal for
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
                Σε ποιους απευθύνεται
              </h3>

              <div className="mt-6 flex flex-wrap gap-3">
                {audiences.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#e7ddd3] bg-[#faf7f2] px-4 py-2 text-sm font-medium text-[#5f5146]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 rounded-[24px] border border-[#e8ddd2] bg-[#faf7f2] p-5">
                <p className="text-lg font-semibold text-gray-900">
                  Ξεκινήστε δωρεάν για 14 ημέρες
                </p>
                <p className="mt-2 text-sm leading-6 text-[#7b6657]">
                  Στήστε το κατάστημά σας, περάστε το μενού, δημιουργήστε QR
                  codes και δοκιμάστε το σύστημα στην πράξη χωρίς δέσμευση.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111827]"
                  >
                    Κάνε εγγραφή
                  </Link>

                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] transition hover:bg-[#f6efe8]"
                  >
                    Έχω ήδη λογαριασμό
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#e9e0d6] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
            Final CTA
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Δώσε στο κατάστημά σου ένα πιο σύγχρονο σύστημα παραγγελιοληψίας
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#7b6657]">
            Ο πελάτης παραγγέλνει εύκολα από το κινητό, το προσωπικό δουλεύει πιο
            οργανωμένα και η επιχείρηση αποκτά μια πιο σύγχρονη εμπειρία
            εξυπηρέτησης.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#111827]"
            >
              Ξεκίνα δωρεάν
            </Link>

            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-[#faf7f2] px-6 py-3 text-sm font-semibold text-[#5f5146] transition hover:bg-[#f6efe8]"
            >
              Σύνδεση
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}