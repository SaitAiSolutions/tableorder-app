'use client'

import { useState, useTransition } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { TableWithActiveSession } from '@/types/database.types'
import { createTable } from '@/lib/actions/tables.actions'
import { generateTableUrl } from '@/lib/utils/generate-table-url'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

interface TableManagerProps {
  tables: TableWithActiveSession[]
  businessSlug: string
}

export function TableManager({ tables, businessSlug }: TableManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null)
  const [openQrTableId, setOpenQrTableId] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null)
      setSuccess(null)

      const result = await createTable(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess('Το τραπέζι δημιουργήθηκε.')
    })
  }

  async function handleCopy(url: string, tableId: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedTableId(tableId)
      setTimeout(() => setCopiedTableId(null), 2000)
    } catch {
      setError('Αποτυχία αντιγραφής συνδέσμου.')
    }
  }

  function handlePrintQr(tableId: string) {
    const wrapper = document.getElementById(`qr-print-${tableId}`)
    if (!wrapper) return

    const printWindow = window.open('', '_blank', 'width=600,height=800')
    if (!printWindow) {
      setError('Δεν ήταν δυνατό να ανοίξει νέο παράθυρο για εκτύπωση.')
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Table</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #ffffff;
            }
            .wrap {
              text-align: center;
              padding: 24px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 12px;
            }
            .subtitle {
              font-size: 16px;
              color: #555;
              margin-bottom: 20px;
            }
            .qr {
              display: inline-block;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 16px;
            }
          </style>
        </head>
        <body>
          <div class="wrap">
            ${wrapper.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
          Table setup
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
          Διαχείριση τραπεζιών
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Προσθέστε τραπέζια για το QR ordering και δείτε γρήγορα την κατάστασή τους.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} />
        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <Field label="Αριθμός τραπεζιού" htmlFor="table_number" required>
          <Input
            id="table_number"
            name="table_number"
            placeholder="π.χ. 1"
            required
            className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
          />
        </Field>

        <Field label="Όνομα / σημείωση" htmlFor="name">
          <Input
            id="name"
            name="name"
            placeholder="π.χ. Βεράντα"
            className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
          />
        </Field>

        <Button type="submit" loading={isPending} className="rounded-2xl">
          Προσθήκη τραπεζιού
        </Button>
      </form>

      <div className="mt-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Υπάρχοντα τραπέζια</h4>
          <p className="mt-1 text-sm text-[#7b6657]">
            Συνολικά τραπέζια: {tables.length}
          </p>
        </div>

        {tables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cdc1] bg-[#fffdfa] px-4 py-8 text-center text-sm text-[#7b6657]">
            Δεν υπάρχουν τραπέζια ακόμα.
          </div>
        ) : (
          <div className="space-y-4">
            {tables.map((table) => {
              const customerUrl = generateTableUrl(businessSlug, table.id)
              const isQrOpen = openQrTableId === table.id

              return (
                <div
                  key={table.id}
                  className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Τραπέζι {table.table_number}
                      </p>
                      <p className="mt-1 text-xs text-[#7b6657]">
                        {table.name ?? 'Χωρίς σημείωση'}
                      </p>
                    </div>

                    <span
                      className={
                        table.active_session
                          ? 'rounded-full bg-[#fce7d6] px-3 py-1 text-xs font-medium text-[#9a5b24]'
                          : 'rounded-full bg-[#e7f6ea] px-3 py-1 text-xs font-medium text-[#26734d]'
                      }
                    >
                      {table.active_session ? 'Κατειλημμένο' : 'Ελεύθερο'}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#e8ddd2] bg-white p-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b715d]">
                      Customer link
                    </p>
                    <p className="mt-2 break-all text-sm text-gray-700">
                      {customerUrl}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="rounded-2xl"
                        onClick={() => handleCopy(customerUrl, table.id)}
                      >
                        {copiedTableId === table.id ? 'Αντιγράφηκε' : 'Copy link'}
                      </Button>

                      <a
                        href={customerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-2xl border border-[#d9cec3] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] transition hover:bg-[#f6efe8]"
                      >
                        Άνοιγμα
                      </a>

                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-2xl"
                        onClick={() =>
                          setOpenQrTableId(isQrOpen ? null : table.id)
                        }
                      >
                        {isQrOpen ? 'Κλείσιμο QR' : 'Generate QR'}
                      </Button>
                    </div>
                  </div>

                  {isQrOpen ? (
                    <div className="mt-4 rounded-2xl border border-[#e8ddd2] bg-white p-4">
                      <div
                        id={`qr-print-${table.id}`}
                        className="flex flex-col items-center text-center"
                      >
                        <div className="title text-xl font-semibold text-gray-900">
                          Τραπέζι {table.table_number}
                        </div>
                        <div className="subtitle mt-1 text-sm text-[#7b6657]">
                          {table.name ?? 'QR Ordering'}
                        </div>

                        <div className="qr mt-4 rounded-2xl border border-[#eee5dc] bg-white p-4">
                          <QRCodeSVG value={customerUrl} size={220} includeMargin />
                        </div>

                        <p className="mt-4 max-w-xs break-all text-xs text-[#7b6657]">
                          {customerUrl}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <Button
                          type="button"
                          className="rounded-2xl"
                          onClick={() => handlePrintQr(table.id)}
                        >
                          Print / Save PDF
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-2xl"
                          onClick={() => handleCopy(customerUrl, table.id)}
                        >
                          Copy link
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}