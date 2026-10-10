import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { getDictionary, isLocale, locales } from '@/lib/i18n'
import { getStorefront } from '@/lib/api'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CUP_ID } from '@/lib/brand'

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
  const cup = storefront?.cups?.find(cup => cup.id === CUP_ID)
  const cupTitle = cup?.title
  // Same rule as the cup page: the deadline is inclusive, in Stockholm time.
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const registrationOpen = !cup || ((!cup.registrationDeadline || cup.registrationDeadline >= today) && (cup.endDate || cup.startDate) >= today)

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader locale={locale} dict={dict} cupTitle={cupTitle} organization={storefront?.organization} registrationOpen={registrationOpen} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale={locale} dict={dict} organization={storefront?.organization} cupTitle={cupTitle} />
    </div>
  )
}
