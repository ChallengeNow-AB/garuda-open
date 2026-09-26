import type { Locale } from './i18n'

const INTL_LOCALE: Record<Locale, string> = { sv: 'sv-SE', en: 'en-GB' }

/** "Sat 26 Jul, 22:00" — from the API's yyyy-MM-dd + HH:mm:ss strings. */
export function formatWhen(date: string | undefined, time: string | undefined, locale: Locale): string {
  if (!date) return ''
  const parsed = new Date(`${date}T${time ?? '00:00:00'}`)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export function formatPrice(price: number | undefined, currency: string | undefined, freeLabel: string): string {
  if (price == null || price <= 0) return freeLabel
  return `${price} ${currency ?? 'SEK'}`
}
