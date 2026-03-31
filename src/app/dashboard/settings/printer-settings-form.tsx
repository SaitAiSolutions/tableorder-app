'use client'

import { useMemo, useState, useTransition } from 'react'
import type { PrinterSettingsRow } from '@/lib/actions/printer.actions'
import {
  testPrinterSettings,
  upsertPrinterSettings,
} from '@/lib/actions/printer.actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

interface PrinterSettingsFormProps {
  printerSettings: PrinterSettingsRow | null
}

export function PrinterSettingsForm({
  printerSettings,
}: PrinterSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [name, setName] = useState(printerSettings?.name ?? 'Main Printer')
  const [isEnabled, setIsEnabled] = useState(printerSettings?.is_enabled ?? false)
  const [printingMode, setPrintingMode] = useState<
    'disabled' | 'browser' | 'escpos_network'
  >(printerSettings?.printing_mode ?? 'disabled')
  const [connectionType, setConnectionType] = useState<'wifi' | 'ethernet' | 'browser'>(
    printerSettings?.connection_type ?? 'wifi',
  )
  const [printerBrand, setPrinterBrand] = useState(printerSettings?.printer_brand ?? '')
  const [printerModel, setPrinterModel] = useState(printerSettings?.printer_model ?? '')
  const [printerIp, setPrinterIp] = useState(printerSettings?.printer_ip ?? '')
  const [printerPort, setPrinterPort] = useState(
    String(printerSettings?.printer_port ?? 9100),
  )
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(
    printerSettings?.paper_width ?? '80mm',
  )
  const [charactersPerLine, setCharactersPerLine] = useState(
    String(printerSettings?.characters_per_line ?? 48),
  )
  const [autoPrintOrders, setAutoPrintOrders] = useState(
    printerSettings?.auto_print_orders ?? true,
  )
  const [autoPrintServiceRequests, setAutoPrintServiceRequests] = useState(
    printerSettings?.auto_print_service_requests ?? false,
  )
  const [autoPrintBills, setAutoPrintBills] = useState(
    printerSettings?.auto_print_bills ?? false,
  )
  const [copiesCount, setCopiesCount] = useState(
    String(printerSettings?.copies_count ?? 1),
  )
  const [cutPaper, setCutPaper] = useState(printerSettings?.cut_paper ?? true)
  const [openCashDrawer, setOpenCashDrawer] = useState(
    printerSettings?.open_cash_drawer ?? false,
  )
  const [headerText, setHeaderText] = useState(printerSettings?.header_text ?? '')
  const [footerText, setFooterText] = useState(printerSettings?.footer_text ?? '')

  const isNetworkMode = printingMode === 'escpos_network'
  const isBrowserMode = printingMode === 'browser'

  const recommendedChars = useMemo(() => {
    return paperWidth === '58mm' ? 32 : 48
  }, [paperWidth])

  function handleSave(formData: FormData) {
    startTransition(async () => {
      setError(null)
      setSuccess(null)

      const result = await upsertPrinterSettings(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess('Οι ρυθμίσεις εκτυπωτή αποθηκεύτηκαν.')
    })
  }

  function handleTest() {
    startTransition(async () => {
      setError(null)
      setSuccess(null)

      const result = await testPrinterSettings()

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess('Το test printer settings ολοκληρώθηκε.')
    })
  }

  return (
    <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
          Printer settings
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
          Ρυθμίσεις εκτυπωτή
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Αποθηκεύστε τον τρόπο εκτύπωσης για την επιχείρησή σας και ετοιμάστε το
          σύστημα για automatic order printing.
        </p>
      </div>

      <form action={handleSave} className="space-y-5">
        <ErrorMessage message={error} />

        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        {printerSettings?.last_test_status ? (
          <div
            className={
              printerSettings.last_test_status === 'success'
                ? 'rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700'
                : 'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
            }
          >
            {printerSettings.last_test_message ?? 'Υπάρχει αποθηκευμένο test result.'}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Όνομα εκτυπωτή" htmlFor="name" required>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
              required
            />
          </Field>

          <Field label="Mode εκτύπωσης" htmlFor="printing_mode" required>
            <select
              id="printing_mode"
              name="printing_mode"
              value={printingMode}
              onChange={(e) =>
                setPrintingMode(
                  e.target.value as 'disabled' | 'browser' | 'escpos_network',
                )
              }
              className="h-12 w-full rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 text-sm text-gray-900 focus:border-[#c9b29d] focus:outline-none focus:ring-2 focus:ring-[#efe4d8]"
            >
              <option value="disabled">Disabled</option>
              <option value="browser">Browser print</option>
              <option value="escpos_network">ESC/POS network printer</option>
            </select>
          </Field>
        </div>

        <div className="rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 py-4">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-900">
            <input
              type="checkbox"
              name="is_enabled"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
            />
            Ενεργοποίηση εκτυπωτή για αυτή την επιχείρηση
          </label>
        </div>

        {isNetworkMode ? (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Connection type" htmlFor="connection_type" required>
                <select
                  id="connection_type"
                  name="connection_type"
                  value={connectionType}
                  onChange={(e) =>
                    setConnectionType(e.target.value as 'wifi' | 'ethernet' | 'browser')
                  }
                  className="h-12 w-full rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 text-sm text-gray-900 focus:border-[#c9b29d] focus:outline-none focus:ring-2 focus:ring-[#efe4d8]"
                >
                  <option value="wifi">Wi-Fi</option>
                  <option value="ethernet">Ethernet</option>
                </select>
              </Field>

              <Field label="IP εκτυπωτή" htmlFor="printer_ip" required>
                <Input
                  id="printer_ip"
                  name="printer_ip"
                  value={printerIp}
                  onChange={(e) => setPrinterIp(e.target.value)}
                  placeholder="π.χ. 192.168.1.120"
                  className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
                  required={isNetworkMode}
                />
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Port" htmlFor="printer_port" required>
                <Input
                  id="printer_port"
                  name="printer_port"
                  value={printerPort}
                  onChange={(e) => setPrinterPort(e.target.value)}
                  placeholder="9100"
                  className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
                />
              </Field>

              <Field label="Paper width" htmlFor="paper_width" required>
                <select
                  id="paper_width"
                  name="paper_width"
                  value={paperWidth}
                  onChange={(e) => setPaperWidth(e.target.value as '58mm' | '80mm')}
                  className="h-12 w-full rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 text-sm text-gray-900 focus:border-[#c9b29d] focus:outline-none focus:ring-2 focus:ring-[#efe4d8]"
                >
                  <option value="58mm">58mm</option>
                  <option value="80mm">80mm</option>
                </select>
              </Field>
            </div>
          </>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Printer brand" htmlFor="printer_brand">
            <Input
              id="printer_brand"
              name="printer_brand"
              value={printerBrand}
              onChange={(e) => setPrinterBrand(e.target.value)}
              placeholder="π.χ. Epson"
              className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
            />
          </Field>

          <Field label="Printer model" htmlFor="printer_model">
            <Input
              id="printer_model"
              name="printer_model"
              value={printerModel}
              onChange={(e) => setPrinterModel(e.target.value)}
              placeholder="π.χ. TM-T20"
              className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Characters per line" htmlFor="characters_per_line">
            <Input
              id="characters_per_line"
              name="characters_per_line"
              value={charactersPerLine}
              onChange={(e) => setCharactersPerLine(e.target.value)}
              placeholder={String(recommendedChars)}
              className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
            />
          </Field>

          <Field label="Copies count" htmlFor="copies_count">
            <Input
              id="copies_count"
              name="copies_count"
              value={copiesCount}
              onChange={(e) => setCopiesCount(e.target.value)}
              placeholder="1"
              className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Header text" htmlFor="header_text">
            <Input
              id="header_text"
              name="header_text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="π.χ. Kitchen printer"
              className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
            />
          </Field>

          <Field label="Footer text" htmlFor="footer_text">
            <Input
              id="footer_text"
              name="footer_text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="π.χ. Thank you"
              className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 py-4">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-900">
              <input
                type="checkbox"
                name="auto_print_orders"
                checked={autoPrintOrders}
                onChange={(e) => setAutoPrintOrders(e.target.checked)}
              />
              Auto print παραγγελιών
            </label>
          </div>

          <div className="rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 py-4">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-900">
              <input
                type="checkbox"
                name="auto_print_service_requests"
                checked={autoPrintServiceRequests}
                onChange={(e) => setAutoPrintServiceRequests(e.target.checked)}
              />
              Auto print service requests
            </label>
          </div>

          <div className="rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 py-4">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-900">
              <input
                type="checkbox"
                name="auto_print_bills"
                checked={autoPrintBills}
                onChange={(e) => setAutoPrintBills(e.target.checked)}
              />
              Auto print bill requests
            </label>
          </div>

          <div className="rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 py-4">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-900">
              <input
                type="checkbox"
                name="cut_paper"
                checked={cutPaper}
                onChange={(e) => setCutPaper(e.target.checked)}
              />
              Cut paper after print
            </label>
          </div>

          <div className="rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 py-4 md:col-span-2">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-900">
              <input
                type="checkbox"
                name="open_cash_drawer"
                checked={openCashDrawer}
                onChange={(e) => setOpenCashDrawer(e.target.checked)}
              />
              Open cash drawer
            </label>
          </div>
        </div>

        {isBrowserMode ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Στο browser mode το σύστημα θα χρησιμοποιεί printable view / browser print
            flow αντί για direct network printer.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={isPending} className="rounded-2xl">
            Αποθήκευση printer settings
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="rounded-2xl"
            onClick={handleTest}
            disabled={isPending}
          >
            Test printer settings
          </Button>
        </div>
      </form>
    </div>
  )
}