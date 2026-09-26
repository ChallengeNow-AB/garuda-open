import en from './dictionaries/en.json'
import sv from './dictionaries/sv.json'

export const locales = ['sv', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'sv'

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

/** Dictionaries share the shape of the Swedish (default) file. */
export type Dictionary = typeof sv
const dictionaries: Record<Locale, Dictionary> = { sv, en }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}

export const LOCALE_LABELS: Record<Locale, string> = { sv: 'Svenska', en: 'English' }
