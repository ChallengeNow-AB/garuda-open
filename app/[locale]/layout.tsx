import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { getDictionary, isLocale, locales } from '@/lib/i18n'
import { getStorefront } from '@/lib/api'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const storefront = await getStorefront('satuminton')
  const visibleSections = {
    leagues: Boolean(storefront?.leagues.length),
    activities: Boolean(storefront?.events.length),
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader locale={locale} dict={dict} organization={storefront?.organization} visibleSections={visibleSections} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale={locale} dict={dict} organization={storefront?.organization} />
    </div>
  )
}
