import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, RefreshCcw, Trophy, UsersRound } from 'lucide-react'
import { getCupDetailResult, getStorefrontDetailResult, type DetailKind } from '@/lib/api'
import { getDictionary, isLocale, type Locale } from '@/lib/i18n'
import { formatPrice, formatWhen } from '@/lib/format'
import type { RegistrationTarget } from '@/lib/registration'
import type { MatchSummary, StandingSummary, StorefrontDetail, TeamSummary } from '@/lib/types'
import { CupRegistrationForm } from '@/components/cup-registration-form'
import { CupDetail } from '@/components/cup-detail'
import { PlatformSection } from '@/components/platform-section'

type Props = { params: Promise<{ locale: string; slug: string; kind: string; id: string }> }
type RouteKind = DetailKind | 'cup'

function isRouteKind(value: string): value is RouteKind {
  return value === 'league' || value === 'cup' || value === 'tournament' || value === 'activity'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, kind, id } = await params
  const numericId = Number(id)
  if (slug !== 'satuminton' || !isRouteKind(kind) || !Number.isSafeInteger(numericId) || numericId <= 0) return { title: 'Not found' }
  if (kind === 'cup') {
    const result = await getCupDetailResult(slug, numericId)
    return { title: result.status === 'ok' ? result.data.title : 'Not found' }
  }
  const result = await getStorefrontDetailResult(slug, kind, numericId)
  const title = result.status === 'ok' ? result.data.league?.name ?? result.data.activity?.title : undefined
  return { title: title || 'Not found' }
}

export default async function DetailPage({ params }: Props) {
  const { locale, slug, kind, id } = await params
  const numericId = Number(id)
  if (!isLocale(locale) || slug !== 'satuminton' || !isRouteKind(kind) || !Number.isSafeInteger(numericId) || numericId <= 0) notFound()
  const dict = getDictionary(locale)

  if (kind === 'cup') {
    const result = await getCupDetailResult(slug, numericId)
    if (result.status === 'not-found') notFound()
    if (result.status === 'error') return <ServerTimeout locale={locale} slug={slug} kind={kind} id={id} />
    return <CupDetail cup={result.data} locale={locale} slug={slug} dict={dict} />
  }

  const result = await getStorefrontDetailResult(slug, kind, numericId)
  if (result.status === 'not-found') notFound()
  if (result.status === 'error') return <ServerTimeout locale={locale} slug={slug} kind={kind} id={id} />
  return <ActivityDetail detail={result.data} kind={kind} id={numericId} locale={locale} slug={slug} />
}

function ActivityDetail({ detail, kind, id, locale, slug }: { detail: StorefrontDetail; kind: DetailKind; id: number; locale: Locale; slug: string }) {
  const dict = getDictionary(locale)
  const league = detail.league
  const activity = detail.activity
  const title = league?.name ?? activity?.title ?? ''
  const description = league?.description ?? activity?.description
  const imageUrl = league?.imageUrl ?? activity?.imageUrl
  const category = league?.category ?? activity?.category
  const venue = league?.locality ?? activity?.venueName ?? activity?.address?.city
  const full = activity?.capacity != null && activity.joined != null && activity.joined >= activity.capacity
  const ended = league ? Boolean(league.endDate && league.endDate < Date.now()) : Boolean(activity?.endDate || activity?.startDate) && new Date(activity?.endDate || activity?.startDate || '').getTime() < new Date().setHours(0, 0, 0, 0)
  const closed = ended || (league ? (league.seasonStarted && !league.joinWhileStarted) || (league.capacity > 0 && detail.participants.length >= league.capacity) : Boolean(activity?.registrationClosed || full))
  const target: RegistrationTarget = kind === 'league' ? 'league' : kind === 'tournament' ? 'tournament' : 'event'
  const kindLabel = kind === 'league' ? dict.detail.league : kind === 'tournament' ? dict.detail.tournament : dict.detail.activity
  const price = league ? formatPrice(league.fee, league.currency, dict.common.free) : formatPrice(activity?.price, activity?.currency, dict.common.free)
  const date = activity ? formatWhen(activity.startDate, activity.startTime, locale) : null

  return (
    <>
      <section className="bg-hero text-white">
        <div className="mx-auto grid max-w-5xl items-center gap-6 px-5 py-8 sm:px-8 sm:py-10 md:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            <Link href={`/${locale}/${slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-white/70 transition hover:text-white"><ArrowLeft size={17} />{dict.detail.back}</Link>
            <span className="mt-5 block w-fit rounded-full bg-accent px-4 py-2 text-xs font-black uppercase tracking-widest text-ink">{kindLabel}</span>
            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-[-.04em] sm:text-4xl">{title}</h1>
            {description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">{description}</p>}
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-4 text-sm font-bold text-white/80">
              {category && <span>{category}</span>}
              {date && <span className="inline-flex items-center gap-2"><CalendarDays size={17} className="text-accent" />{date}</span>}
              {venue && <span className="inline-flex items-center gap-2"><MapPin size={17} className="text-accent" />{venue}</span>}
              <span>{price}</span>
            </div>
            <div className="mt-9">
              {closed
                ? <span className="rounded-full bg-white/15 px-6 py-3.5 text-sm font-bold text-white/75">{dict.detail.registrationClosed}</span>
                : <a href="#registration" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-black text-ink transition hover:-translate-y-0.5 hover:bg-white">{dict.detail.register}<ArrowUpRight size={17} /></a>}
            </div>
          </div>
          <div className="h-32 overflow-hidden rounded-xl sm:h-40 md:h-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl || '/badminton.jpg'} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {!closed && <section id="registration" className="mx-auto max-w-3xl scroll-mt-8 px-5 py-12">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card sm:p-8">
        <h2 className="mb-6 text-2xl font-bold">{dict.detail.register}</h2>
        <CupRegistrationForm cupTitle={title} currency={league?.currency ?? activity?.currency} fallbackPrice={league?.fee ?? activity?.price}
          target={target} locale={locale} dict={dict} divisions={[{
            id, title, joined: activity?.joined ?? detail.participants.length, registrationClosed: closed,
            targetAudience: league?.targetAudience ?? activity?.targetAudience,
            targetGender: league?.targetGender ?? activity?.targetGender,
            skillLevel: activity?.skillLevel,
          }]} />
        </div>
      </section>}
      <div className="mx-auto grid max-w-[1500px] gap-4 px-5 py-8 sm:grid-cols-3 sm:px-10 lg:px-16 xl:px-24">
        <Stat value={detail.participants.length} label={dict.detail.teams} />
        <Stat value={detail.matches.length} label={dict.detail.matchesCount} />
        <Stat value={detail.matches.filter(match => match.homeGoals != null && match.awayGoals != null).length} label={dict.detail.final} />
      </div>
      {detail.standings.length > 0 && <Standings standings={detail.standings} locale={locale} />}
      <Teams teams={detail.participants} locale={locale} />
      <Matches matches={detail.matches} locale={locale} />
      <PlatformSection dict={dict} />
    </>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return <div className="rounded-2xl border border-border bg-white px-6 py-5 shadow-card"><p className="text-3xl font-black text-brand">{value}</p><p className="mt-1 text-sm font-bold text-muted-foreground">{label}</p></div>
}

function TeamMark({ team }: { team: TeamSummary }) {
  return team.logoUrl
    ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={team.logoUrl} alt="" className="h-10 w-10 rounded-xl border border-border bg-white object-contain p-1" /></>
    : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-tint text-sm font-black text-brand">{team.name.slice(0, 2).toUpperCase()}</span>
}

function Teams({ teams, locale }: { teams: TeamSummary[]; locale: Locale }) {
  const dict = getDictionary(locale)
  return <section className="mx-auto max-w-[1500px] px-5 py-10 sm:px-10 lg:px-16 xl:px-24"><h2 className="text-3xl font-black tracking-tight">{dict.detail.registeredTeams}</h2>{teams.length
    ? <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{teams.map(team => <div key={team.id} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4"><TeamMark team={team} /><div><p className="font-bold">{team.name}</p>{team.organizationName && <p className="text-xs text-muted-foreground">{team.organizationName}</p>}</div></div>)}</div>
    : <p className="mt-5 rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">{dict.detail.noTeams}</p>}</section>
}

function Standings({ standings, locale }: { standings: StandingSummary[]; locale: Locale }) {
  const dict = getDictionary(locale)
  return <section className="border-y border-border bg-white"><div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-10 lg:px-16 xl:px-24"><h2 className="text-3xl font-black tracking-tight">{dict.detail.standings}</h2><div className="mt-6 overflow-x-auto rounded-2xl border border-border"><table className="w-full min-w-[640px] text-sm"><thead className="bg-brand-tint text-left text-xs font-black uppercase tracking-wide text-brand"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">{dict.detail.teams}</th><th className="px-3 py-3">{dict.detail.played}</th><th className="px-3 py-3">{dict.detail.won}</th><th className="px-3 py-3">{dict.detail.drawn}</th><th className="px-3 py-3">{dict.detail.lost}</th><th className="px-3 py-3">{dict.detail.goalDifference}</th><th className="px-4 py-3 text-right">{dict.detail.points}</th></tr></thead><tbody className="divide-y divide-border">{standings.map(row => <tr key={row.teamId}><td className="px-4 py-4 font-bold">{row.position}</td><td className="px-4 py-4 font-bold">{row.teamName}</td><td className="px-3 py-4">{row.played}</td><td className="px-3 py-4">{row.won}</td><td className="px-3 py-4">{row.drawn}</td><td className="px-3 py-4">{row.lost}</td><td className="px-3 py-4">{row.goalDifference}</td><td className="px-4 py-4 text-right font-black">{row.points}</td></tr>)}</tbody></table></div></div></section>
}

function Matches({ matches, locale }: { matches: MatchSummary[]; locale: Locale }) {
  const dict = getDictionary(locale)
  return <section className="mx-auto max-w-[1500px] px-5 py-10 sm:px-10 lg:px-16 xl:px-24"><h2 className="text-3xl font-black tracking-tight">{dict.detail.matches}</h2>{matches.length
    ? <div className="mt-6 grid gap-4 lg:grid-cols-2">{matches.map(match => <article key={match.id} className="rounded-2xl border border-border bg-white p-5"><div className="flex justify-between gap-3 text-xs font-bold uppercase text-muted-foreground"><span>{match.homeGoals != null ? dict.detail.final : dict.detail.upcoming}</span><span>{new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(match.startDateTime))}</span></div><div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm font-bold"><span className="truncate">{match.homeTeam.name}</span><span className="rounded-lg bg-ink px-3 py-2 text-white">{match.homeGoals != null ? `${match.homeGoals}–${match.awayGoals}` : '–'}</span><span className="truncate text-right">{match.awayTeam?.name || 'TBD'}</span></div>{match.venueName && <p className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><MapPin size={14} />{match.venueName}</p>}</article>)}</div>
    : <p className="mt-5 rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">{dict.detail.noMatches}</p>}</section>
}

function ServerTimeout({ locale, slug, kind, id }: { locale: Locale; slug: string; kind: RouteKind; id: string }) {
  const dict = getDictionary(locale)
  return <section className="mx-auto max-w-3xl px-5 py-24 text-center"><Trophy size={38} className="mx-auto text-brand" /><h1 className="mt-5 text-3xl font-black">{locale === 'sv' ? 'Vi kan inte visa sidan just nu.' : 'We cannot show this page right now.'}</h1><p className="mt-3 text-muted-foreground">{locale === 'sv' ? 'Försök igen om en stund.' : 'Please try again in a moment.'}</p><div className="mt-8 flex justify-center gap-3"><a href={`/${locale}/${slug}/${kind}/${id}`} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"><RefreshCcw size={16} />{locale === 'sv' ? 'Försök igen' : 'Try again'}</a><Link href={`/${locale}/${slug}`} className="rounded-full border border-border px-5 py-3 text-sm font-bold">{dict.detail.back}</Link></div></section>
}
