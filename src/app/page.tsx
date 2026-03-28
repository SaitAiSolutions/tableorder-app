import Link from 'next/link'
import { Button } from '@/components/ui/button'

const features = [
  {
    title: 'QR παραγγελιοληψία',
    description:
      'Οι πελάτες σκανάρουν το QR από το τραπέζι τους, βλέπουν το menu και στέλνουν παραγγελία απευθείας από το κινητό.',
  },
  {
    title: 'Ζωντανή λήψη παραγγελιών',
    description:
      'Οι παραγγελίες εμφανίζονται άμεσα στο dashboard του καταστήματος για γρήγορη εξυπηρέτηση.',
  },
  {
    title: 'Διαχείριση menu',
    description:
      'Φτιάξτε κατηγορίες, προϊόντα, επιλογές όπως ζάχαρη ή μέγεθος και ενημερώστε τη διαθεσιμότητα εύκολα.',
  },
  {
    title: 'Έλεγχος τραπεζιών',
    description:
      'Παρακολουθήστε ποια τραπέζια είναι ελεύθερα ή κατειλημμένα και εκκαθαρίστε τα όταν ολοκληρώνεται η εξυπηρέτηση.',
  },
  {
    title: 'Για καφετέριες, snack bars και μικρά καταστήματα',
    description:
      'Ιδανικό για επιχειρήσεις που θέλουν ένα απλό και σύγχρονο σύστημα παραγγελιών χωρίς περίπλοκη εγκατάσταση.',
  },
  {
    title: 'Γρήγορο στήσιμο',
    description:
      'Κάνετε εγγραφή, προσθέτετε τραπέζια και menu, δημιουργείτε QR links και ξεκινάτε άμεσα.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f3ee] text-gray-900">
      <section className="border-b border-[#e7ddd3] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="inline-flex rounded-full bg-[#f3ece4] px-4 py-1.5 text-sm font-medium text-[#7b6657]">
                TableOrder για καφετέριες & εστίαση
              </p>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Πάρε παραγγελίες με QR menu και live dashboard
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6f6156]">
                Το TableOrder βοηθά καφετέριες και καταστήματα εστίασης να δέχονται
                παραγγελίες από QR code στα τραπέζια, να διαχειρίζονται το menu,
                τα προϊόντα και τις επιλογές τους, και να βλέπουν τις παραγγελίες
                ζωντανά από ένα εύχρηστο dashboard.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/auth/signup">
                  <Button className="rounded-2xl bg-[#1f2937] px-6 py-6 text-base text-white hover:bg-[#111827]">
                    Δωρεάν δοκιμή 14 ημερών
                  </Button>
                </Link>

                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="rounded-2xl border border-[#d8cdc1] bg-white px-6 py-6 text-base text-[#5f5146] hover:bg-[#f8f3ee]"
                  >
                    Σύνδεση
                  </Button>
                </Link>

                <Link href="/demo">
                  <Button
                    variant="ghost"
                    className="rounded-2xl border border-[#d8cdc1] bg-white px-6 py-6 text-base text-[#5f5146] hover:bg-[#f8f3ee]"
                  >
                    Δες demo
                  </Button>
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] p-4">
                  <p className="text-2xl font-semibold text-gray-900">14 ημέρες</p>
                  <p className="mt-1 text-sm text-[#7b6657]">δωρεάν δοκιμή</p>
                </div>

                <div className="rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] p-4">
                  <p className="text-2xl font-semibold text-gray-900">QR Menu</p>
                  <p className="mt-1 text-sm text-[#7b6657]">ανά τραπέζι</p>
                </div>

                <div className="rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] p-4">
                  <p className="text-2xl font-semibold text-gray-900">Live</p>
                  <p className="mt-1 text-sm text-[#7b6657]">παραγγελίες</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-[#e7ddd3] bg-gradient-to-br from-[#1f2937] via-[#2c3645] to-[#8a674f] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
              <div className="rounded-[24px] bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/80">
                  Τι κάνει
                </p>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-base font-semibold">1. Ο πελάτης σκανάρει QR</p>
                    <p className="mt-1 text-sm text-white/80">
                      Βλέπει το menu από το κινητό του χωρίς να χρειάζεται εφαρμογή.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-base font-semibold">2. Στέλνει παραγγελία</p>
                    <p className="mt-1 text-sm text-white/80">
                      Επιλέγει προϊόντα, επιλογές και σημειώσεις εύκολα.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-base font-semibold">3. Το κατάστημα τη βλέπει live</p>
                    <p className="mt-1 text-sm text-white/80">
                      Η παραγγελία εμφανίζεται στο dashboard και το τραπέζι ενημερώνεται άμεσα.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8b715d]">
            Δυνατότητες
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Ό,τι χρειάζεται μια σύγχρονη καφετέρια
          </h2>
          <p className="mt-4 text-base leading-7 text-[#6f6156]">
            Από το menu και τα QR τραπέζια μέχρι τη διαθεσιμότητα προϊόντων και
            τη διαχείριση παραγγελιών, όλα σε ένα περιβάλλον.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[28px] border border-[#e7ddd3] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
            >
              <h3 className="text-xl font-semibold tracking-tight text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#6f6156]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#e7ddd3] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8b715d]">
            Ξεκίνα σήμερα
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Δοκίμασέ το δωρεάν για 14 ημέρες
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6f6156]">
            Κάνε εγγραφή, στήσε το menu σου, δημιούργησε QR links για τα τραπέζια
            και δες αν ταιριάζει στην επιχείρησή σου χωρίς δέσμευση.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button className="rounded-2xl bg-[#1f2937] px-6 py-6 text-base text-white hover:bg-[#111827]">
                Ξεκίνα δωρεάν
              </Button>
            </Link>

            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="rounded-2xl border border-[#d8cdc1] bg-white px-6 py-6 text-base text-[#5f5146] hover:bg-[#f8f3ee]"
              >
                Έχω ήδη λογαριασμό
              </Button>
            </Link>

            <Link href="/demo">
              <Button
                variant="ghost"
                className="rounded-2xl border border-[#d8cdc1] bg-white px-6 py-6 text-base text-[#5f5146] hover:bg-[#f8f3ee]"
              >
                Δες demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}