import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, isLocale } from '@/lib/i18n'
import { getCupDetailResult, getStorefrontResult } from '@/lib/api'
import { CUP_BANNER, CUP_ID, CUP_NAME, STOREFRONT_SLUG } from '@/lib/brand'
import { CupDetail } from '@/components/cup-detail'
import { cache } from 'react'

// This site belongs to Garuda Open 2026, not whichever cup is next.
const getCupPageData = cache(async () => {
  const [storefront, cup] = await Promise.all([
    getStorefrontResult(STOREFRONT_SLUG),
    getCupDetailResult(STOREFRONT_SLUG, CUP_ID),
  ])
  return { storefront, cup }
})

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale) || slug !== STOREFRONT_SLUG) return { title: 'Not found' }
  const { cup, storefront } = await getCupPageData()
  const title = cup.status === 'ok' ? cup.data.title : CUP_NAME
  const description = (cup.status === 'ok' ? cup.data.description : null)
    || (storefront.status === 'ok' ? storefront.data.branding.tagline : null)
    || (locale === 'sv' ? `Cupinformation och anmälan till ${title}.` : `Cup information and registration for ${title}.`)
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, images: [{ url: CUP_BANNER }] },
    ...(cup.status === 'ok' ? {} : { robots: { index: false, follow: false } }),
  }
}

export default async function StorefrontPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale) || slug !== STOREFRONT_SLUG) notFound()
  const dict = getDictionary(locale)
  const { cup, storefront } = await getCupPageData()
  if (cup.status !== 'ok') return (
    <section className="page-container py-16">
      <h1 className="text-4xl font-black">{CUP_NAME}</h1>
      <p role="status" className="mt-5">{locale === 'sv'
        ? 'Cupinformationen är inte tillgänglig just nu. Försök igen om en stund.'
        : 'Cup information is unavailable right now. Please try again shortly.'}</p>
    </section>
  )
  return <CupDetail cup={cup.data} locale={locale} slug={slug} dict={dict}
    storefront={storefront.status === 'ok' ? storefront.data : undefined} landing />
}
