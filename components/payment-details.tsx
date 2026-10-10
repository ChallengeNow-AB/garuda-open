import { CreditCard, Smartphone, Landmark, CircleCheck } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import type { Locale } from '@/lib/i18n'
import type { PaymentMethod, RegistrationReceipt } from '@/lib/types'

function MethodIcon({ name }: { name: string }) {
  const key = name.toLowerCase()
  if (key.includes('swish')) return <Smartphone size={17} aria-hidden="true" />
  if (key.includes('giro') || key.includes('bank') || key.includes('konto')) return <Landmark size={17} aria-hidden="true" />
  return <CreditCard size={17} aria-hidden="true" />
}

/** The organizer's payment channels (Swish number, bankgiro …) as the API publishes them. */
export function PaymentMethodList({ methods, className = '' }: { methods: PaymentMethod[]; className?: string }) {
  if (!methods.length) return null
  return (
    <ul className={`grid gap-2 ${className}`}>
      {methods.map(method => (
        <li key={`${method.providerName}-${method.paymentReference}`} className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand"><MethodIcon name={method.providerName} /></span>
          <span className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">{method.providerName}</span>
            <strong className="block select-all font-mono text-sm text-ink">{method.paymentReference}</strong>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Payment part of the receipt shown right after registration: what to pay, how, and by when. */
export function ReceiptPayment({ receipt, fallbackMethods = [], locale, freeLabel }: {
  receipt: RegistrationReceipt
  fallbackMethods?: PaymentMethod[]
  locale: Locale
  freeLabel: string
}) {
  const sv = locale === 'sv'
  const { payment } = receipt
  if (payment.status === 'FREE') return null
  const methods = payment.methods.length ? payment.methods : fallbackMethods
  const due = payment.dueDate
    ? new Intl.DateTimeFormat(sv ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(payment.dueDate))
    : null

  if (payment.status === 'PAID') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-brand-tint px-4 py-3 text-sm font-semibold text-brand">
        <CircleCheck size={19} aria-hidden="true" />{sv ? 'Avgiften är betald.' : 'The entry fee is paid.'}
      </div>
    )
  }

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: sv ? 'Att betala' : 'Amount due', value: formatPrice(payment.amount, payment.currency ?? undefined, freeLabel) },
    ...(payment.ocr ? [{ label: sv ? 'OCR / referens' : 'OCR / reference', value: payment.ocr, mono: true }] : []),
    ...(due ? [{ label: sv ? 'Sista betalningsdag' : 'Due date', value: due }] : []),
    ...(payment.invoiceNumber ? [{ label: sv ? 'Fakturanummer' : 'Invoice number', value: payment.invoiceNumber, mono: true }] : []),
  ]

  return (
    <div className="rounded-2xl border border-border bg-[#f6faf8] p-5 text-left sm:p-6">
      <h4 className="text-lg font-black text-ink">{sv ? 'Betalning' : 'Payment'}</h4>
      <p className="mt-1 text-sm text-muted-foreground">
        {payment.status === 'PENDING'
          ? (sv ? 'Arrangören skickar betalningsuppgifterna till dig.' : 'The organizer will send you the payment details.')
          : (sv ? 'Betala anmälningsavgiften för att säkra er plats. Uppgifterna finns också i bekräftelsemejlet.' : 'Pay the entry fee to secure your place. The details are also in your confirmation email.')}
      </p>
      <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(row => (
          <div key={row.label}>
            <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{row.label}</dt>
            <dd className={`mt-0.5 text-base font-bold text-ink ${row.mono ? 'select-all font-mono' : ''}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      {methods.length > 0 && <>
        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{sv ? 'Betala med' : 'Pay with'}</p>
        <PaymentMethodList methods={methods} className="mt-2 sm:grid-cols-2" />
      </>}
    </div>
  )
}
