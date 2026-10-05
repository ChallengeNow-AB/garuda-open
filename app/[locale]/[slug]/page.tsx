import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { getDictionary, isLocale } from '@/lib/i18n'
import { getStorefrontResult } from '@/lib/api'
import { STOREFRONT_NAME, STOREFRONT_SLUG, unpublishedStorefront } from '@/lib/brand'
import { CupDetail } from '@/components/cup-detail'
import type { Cup } from '@/lib/types'
import { CupCard } from '@/components/cup-card'
import { EventCard } from '@/components/event-card'
import { LeagueCard } from '@/components/league-card'
import { PlatformSection } from '@/components/platform-section'

// Prefer the next/current cup, or the latest completed cup when the season is over.
function selectFeaturedCup(cups: Cup[]) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(new Date())
  const sorted = [...cups].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id)
  return sorted.find(cup => (cup.endDate || cup.startDate).slice(0, 10) >= today) ?? sorted.at(-1)
}

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale) || slug !== STOREFRONT_SLUG) return { title: 'Not found' }
  const result = await getStorefrontResult(slug)
  const cup = result.status === 'ok' ? selectFeaturedCup(result.data.cups ?? []) : undefined
  const title = cup ? `${cup.title} | ${STOREFRONT_NAME}` : STOREFRONT_NAME
  const description = cup?.description || getDictionary(locale).org.tournamentsDescription
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, images: [{ url: cup?.imageUrl || '/badminton.jpg' }] },
    ...(result.status === 'ok' ? {} : { robots: { index: false, follow: false } }),
  }
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-black uppercase tracking-[.2em] text-brand">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">{title}</h2>
      </div>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-right sm:text-base">{description}</p>
    </div>
  )
}

export default async function StorefrontPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale) || slug !== STOREFRONT_SLUG) notFound()
  const dict = getDictionary(locale)
  const result = await getStorefrontResult(slug)
  const storefront = result.status === 'ok' ? result.data : unpublishedStorefront

  const { organization, branding, leagues, events } = storefront
  const cups = storefront.cups ?? []
  const standaloneTournaments = storefront.tournaments.filter(tournament => !tournament.cupId)
  const featuredCup = selectFeaturedCup(cups)
  const otherCups = cups.filter(cup => cup.id !== featuredCup?.id)
  const competitionCount = otherCups.length + standaloneTournaments.length
  return (
    <>
      {result.status !== 'ok' && (
        <div role="status" className="border-b border-brand/15 bg-brand-tint px-5 py-3 text-center text-sm font-semibold text-ink">
          {result.status === 'not-found' ? dict.common.awaitingPublication : dict.common.apiUnavailable}
        </div>
      )}
      {featuredCup ? (
        <CupDetail cup={featuredCup} locale={locale} slug={slug} dict={dict} storefront={storefront} landing />
      ) : (
        <section id="competitions" className="scroll-mt-24 bg-hero text-white">
          <div className="page-container py-12 sm:py-16">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">{organization.name}</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{dict.org.tournamentsTitle}</h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-white/75">{dict.org.tournamentsDescription}</p>
          </div>
        </section>
      )}

      {(competitionCount > 0 || !featuredCup) && (
      <section className="scroll-mt-24 page-container py-10 sm:py-12">
        <SectionHeading eyebrow={dict.org.tournamentsEyebrow} title={dict.org.tournamentsTitle} description={dict.org.tournamentsDescription} />
        {competitionCount ? (
          <div className="grid gap-5 md:grid-cols-2">
            {otherCups.map(cup => <CupCard key={cup.id} cup={cup} locale={locale} slug={slug} dict={dict} />)}
            {standaloneTournaments.map(activity => <EventCard key={activity.id} activity={activity} kind="tournament" locale={locale} slug={slug} dict={dict} />)}
          </div>
        ) : (
          <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-border bg-white p-7 sm:flex-row sm:items-center sm:p-10">
            <div><Trophy size={28} className="text-brand" /><h3 className="mt-4 text-xl font-black">{dict.org.competitionsEmpty}</h3><p className="mt-2 text-sm text-muted-foreground">{dict.org.competitionsEmptyText}</p></div>
          </div>
        )}
      </section>

      )}

      {leagues.length > 0 && (
        <section id="ligor" className="scroll-mt-24 border-y border-border bg-white">
          <div className="page-container py-10 sm:py-12">
            <SectionHeading eyebrow={dict.org.leaguesEyebrow} title={dict.org.leaguesTitle} description={dict.org.leaguesDescription} />
            <div className="grid gap-5 md:grid-cols-2">{leagues.map(league => <LeagueCard key={league.id} league={league} locale={locale} slug={slug} dict={dict} />)}</div>
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section id="aktiviteter" className="scroll-mt-24 page-container py-10 sm:py-12">
          <SectionHeading eyebrow={dict.org.activitiesEyebrow} title={dict.org.activitiesTitle} description={dict.org.activitiesDescription} />
          <div className="grid gap-5 md:grid-cols-2">{events.map(activity => <EventCard key={activity.id} activity={activity} kind="event" locale={locale} slug={slug} dict={dict} />)}</div>
        </section>
      )}

      <section id="om" className="page-container scroll-mt-24 py-10 sm:py-12">
        <div className="grid gap-5 border-t border-border pt-8 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">{dict.nav.about}</p>
            <h2 className="mt-3 text-xl font-bold tracking-tight">{organization.name}</h2>
          </div>
          <div className="max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground">
            <p className="whitespace-pre-line break-words">{branding.about || dict.org.aboutText}</p>
            {organization.address && Object.values(organization.address).some(Boolean) && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">{locale === 'sv' ? 'Arrangörens adress' : 'Organizer address'}</p>
                <p className="mt-1">{[organization.address.street, organization.address.postCode, organization.address.city].filter(Boolean).join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      </section>
      <PlatformSection dict={dict} />
    </>
  )
}
