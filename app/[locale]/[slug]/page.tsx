import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowRight, ArrowUpRight, CalendarDays, Trophy } from 'lucide-react'
import { getDictionary, isLocale } from '@/lib/i18n'
import { getStorefrontResult } from '@/lib/api'
import { STOREFRONT_NAME, STOREFRONT_SLUG, unpublishedStorefront } from '@/lib/brand'
import { playerRegistrationUrl } from '@/lib/registration'
import { OrgHero } from '@/components/org-hero'
import { CupCard } from '@/components/cup-card'
import { EventCard } from '@/components/event-card'
import { LeagueCard } from '@/components/league-card'
import { PlatformSection } from '@/components/platform-section'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale) || slug !== STOREFRONT_SLUG) return { title: 'Not found' }
  const result = await getStorefrontResult(slug)
  const title = STOREFRONT_NAME
  const description = result.status === 'ok'
    ? result.data.branding.tagline || `Badminton, cuper och aktiviteter hos ${title}.`
    : `Badminton, cuper och aktiviteter hos ${title}.`
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, images: [{ url: '/badminton_player_female.jpg' }] },
    ...(result.status === 'ok' ? {} : { robots: { index: false, follow: false } }),
  }
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-black uppercase tracking-[.2em] text-brand">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-.045em] text-ink sm:text-5xl">{title}</h2>
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
  const competitionCount = cups.length + standaloneTournaments.length
  return (
    <>
      {result.status !== 'ok' && (
        <div role="status" className="border-b border-brand/15 bg-brand-tint px-5 py-3 text-center text-sm font-semibold text-ink">
          {result.status === 'not-found' ? dict.common.awaitingPublication : dict.common.apiUnavailable}
        </div>
      )}
      <OrgHero organization={organization} branding={branding} dict={dict} primaryHref="#competitions" competitionCount={competitionCount} />

      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-8 sm:grid-cols-3 sm:px-10 lg:px-16 xl:px-24">
          <div className="flex items-center gap-4"><span className="text-3xl font-black text-brand">01</span><p className="text-sm font-bold text-ink">{dict.org.stepOne}</p></div>
          <div className="flex items-center gap-4"><span className="text-3xl font-black text-brand">02</span><p className="text-sm font-bold text-ink">{dict.org.stepTwo}</p></div>
          <div className="flex items-center gap-4"><span className="text-3xl font-black text-brand">03</span><p className="text-sm font-bold text-ink">{dict.org.stepThree}</p></div>
        </div>
      </section>

      <section id="competitions" className="scroll-mt-24 mx-auto max-w-[1500px] px-5 py-16 sm:px-10 sm:py-20 lg:px-16 xl:px-24">
        <SectionHeading eyebrow={dict.org.tournamentsEyebrow} title={dict.org.tournamentsTitle} description={dict.org.tournamentsDescription} />
        {competitionCount ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cups.map(cup => <CupCard key={cup.id} cup={cup} locale={locale} slug={slug} dict={dict} />)}
            {standaloneTournaments.map(activity => <EventCard key={activity.id} activity={activity} kind="tournament" locale={locale} slug={slug} dict={dict} />)}
          </div>
        ) : (
          <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-border bg-white p-7 sm:flex-row sm:items-center sm:p-10">
            <div><Trophy size={28} className="text-brand" /><h3 className="mt-4 text-xl font-black">{dict.org.competitionsEmpty}</h3><p className="mt-2 text-sm text-muted-foreground">{dict.org.competitionsEmptyText}</p></div>
            <a href={playerRegistrationUrl()} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-brand">{dict.org.createPlayer}<ArrowUpRight size={16} /></a>
          </div>
        )}
      </section>

      {leagues.length > 0 && (
        <section id="ligor" className="scroll-mt-24 border-y border-border bg-white">
          <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-10 sm:py-20 lg:px-16 xl:px-24">
            <SectionHeading eyebrow={dict.org.leaguesEyebrow} title={dict.org.leaguesTitle} description={dict.org.leaguesDescription} />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{leagues.map(league => <LeagueCard key={league.id} league={league} locale={locale} slug={slug} dict={dict} />)}</div>
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section id="aktiviteter" className="scroll-mt-24 mx-auto max-w-[1500px] px-5 py-16 sm:px-10 sm:py-20 lg:px-16 xl:px-24">
          <SectionHeading eyebrow={dict.org.activitiesEyebrow} title={dict.org.activitiesTitle} description={dict.org.activitiesDescription} />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{events.map(activity => <EventCard key={activity.id} activity={activity} kind="event" locale={locale} slug={slug} dict={dict} />)}</div>
        </section>
      )}

      <section id="om" className="scroll-mt-24 border-y border-border bg-white">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-2">
          <div className="min-h-[360px] overflow-hidden lg:min-h-[520px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/badminton.jpg" alt={dict.org.aboutImageAlt} className="h-full w-full object-cover" />
          </div>
          <div className="flex items-center px-5 py-12 sm:px-10 lg:px-16 xl:px-24">
            <div className="max-w-xl">
              <p className="text-xs font-black uppercase tracking-[.2em] text-brand">{dict.org.aboutEyebrow}</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-.05em] text-ink sm:text-5xl">{dict.org.aboutTitle}</h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{branding.about || dict.org.aboutText}</p>
              <a href="#join" className="mt-8 inline-flex items-center gap-2 border-b-2 border-brand pb-1 text-sm font-black text-brand">{dict.org.playerCta}<ArrowRight size={17} /></a>
            </div>
          </div>
        </div>
      </section>

      <PlatformSection dict={dict} />

      <section id="join" className="mx-auto max-w-[1500px] px-5 pb-16 sm:px-10 sm:pb-24 lg:px-16 xl:px-24">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-ink px-7 py-10 text-white sm:px-12 sm:py-14 lg:grid-cols-[1fr_auto] lg:px-16">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-accent"><CalendarDays size={16} />{dict.org.joinEyebrow}</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-.045em] sm:text-5xl">{dict.org.joinTitle}</h2>
            <p className="mt-4 leading-relaxed text-white/70">{dict.org.joinText.replace('{name}', organization.name)}</p>
          </div>
          <a href={playerRegistrationUrl()} className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-black text-ink transition hover:-translate-y-0.5 hover:bg-white">{dict.org.createPlayer}<ArrowUpRight size={17} /></a>
        </div>
      </section>
    </>
  )
}
