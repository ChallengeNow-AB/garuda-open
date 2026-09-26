import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, Layers3, UsersRound } from 'lucide-react'
import type { Cup, CupDivision } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { formatPrice } from '@/lib/format'
import { registrationUrl } from '@/lib/registration'

function date(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}

function divisionLabel(value: string | undefined, locale: Locale, kind: 'gender' | 'audience' | 'skill'): string | null {
  if (!value) return null
  const labels: Record<string, [string, string]> = {
    MALE: ['Herrar', 'Men'],
    FEMALE: ['Damer', 'Women'],
    MIXED: ['Mixed', 'Mixed'],
    INDIVIDUAL: ['Singel', 'Singles'],
    DUO: ['Dubbel', 'Doubles'],
    SQUAD: ['Lag', 'Teams'],
    BEGINNER: ['Nybörjare', 'Beginner'],
    INTERMEDIATE: ['Medel', 'Intermediate'],
    PRO: ['Avancerad', 'Advanced'],
    ELITE: ['Elit', 'Elite'],
  }
  const label = labels[value]?.[locale === 'sv' ? 0 : 1]
  return label || (kind === 'skill' ? value.toLowerCase() : value)
}

function DivisionCard({ division, cup, locale, slug, dict }: { division: CupDivision; cup: Cup; locale: Locale; slug: string; dict: Dictionary }) {
  const spotsLeft = division.capacity == null ? null : Math.max(division.capacity - division.joined, 0)
  const deadlinePassed = cup.registrationDeadline ? new Date(cup.registrationDeadline).getTime() < new Date().setHours(0, 0, 0, 0) : false
  const cupFinished = new Date(cup.endDate || cup.startDate).getTime() < new Date().setHours(0, 0, 0, 0)
  const open = !division.registrationClosed && !deadlinePassed && !cupFinished && spotsLeft !== 0
  const facts = [
    { label: dict.detail.divisionGender, value: divisionLabel(division.targetGender, locale, 'gender') },
    { label: dict.detail.divisionFormat, value: divisionLabel(division.targetAudience, locale, 'audience') },
    { label: dict.detail.divisionLevel, value: divisionLabel(division.skillLevel, locale, 'skill') },
  ].filter(fact => fact.value)

  return (
    <article className="flex h-full flex-col rounded-3xl border border-border bg-white p-6 shadow-card sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-brand">{dict.detail.cup}</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-.04em] text-ink">{division.title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${open ? 'bg-brand-tint text-brand' : 'bg-muted text-muted-foreground'}`}>{open ? dict.common.open : dict.common.closed}</span>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-y border-border py-5 text-sm">
        {facts.map(fact => <div key={fact.label}><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{fact.label}</dt><dd className="mt-1 font-bold text-ink">{fact.value}</dd></div>)}
        <div><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{dict.common.from}</dt><dd className="mt-1 font-bold text-ink">{formatPrice(division.price ?? cup.price, cup.currency, dict.common.free)}</dd></div>
      </dl>
      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><UsersRound size={16} className="text-brand" />{division.joined} {dict.detail.teams}</span>
        {spotsLeft !== null && <span>{spotsLeft} {dict.detail.divisionSpaces}</span>}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
        {open && <a href={registrationUrl('tournament', division.id)} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-brand">{dict.detail.register}<ArrowUpRight size={16} /></a>}
        <Link href={`/${locale}/${slug}/tournament/${division.id}`} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold text-ink transition hover:border-brand hover:text-brand">{dict.detail.openDivision}</Link>
      </div>
    </article>
  )
}

export function CupDetail({ cup, locale, slug, dict }: { cup: Cup; locale: Locale; slug: string; dict: Dictionary }) {
  return (
    <>
      <section className="bg-hero text-white">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[1fr_.8fr]">
          <div className="px-5 py-12 sm:px-10 sm:py-16 lg:px-16 xl:pl-24">
            <Link href={`/${locale}/${slug}#competitions`} className="inline-flex items-center gap-2 text-sm font-bold text-white/70 transition hover:text-white"><ArrowLeft size={17} />{dict.detail.back}</Link>
            <span className="mt-10 block w-fit rounded-full bg-accent px-4 py-2 text-xs font-black uppercase tracking-widest text-ink">{dict.detail.cup}</span>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[.98] tracking-[-.06em] sm:text-7xl">{cup.title}</h1>
            {cup.description && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{cup.description}</p>}
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-4 text-sm font-bold text-white/80">
              <span className="inline-flex items-center gap-2"><CalendarDays size={18} className="text-accent" />{date(cup.startDate, locale)}{cup.endDate && cup.endDate !== cup.startDate ? ` – ${date(cup.endDate, locale)}` : ''}</span>
              <span className="inline-flex items-center gap-2"><Layers3 size={18} className="text-accent" />{cup.divisions.length} {dict.common.divisions}</span>
              {cup.registrationDeadline && <span className="inline-flex items-center gap-2"><Clock3 size={18} className="text-accent" />{dict.detail.registrationDeadline}: {date(cup.registrationDeadline, locale)}</span>}
            </div>
          </div>
          <div className="min-h-[300px] overflow-hidden lg:min-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cup.imageUrl || '/badminton.jpg'} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-10 sm:py-20 lg:px-16 xl:px-24">
        <p className="text-xs font-black uppercase tracking-[.2em] text-brand">{dict.detail.cup}</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-ink sm:text-5xl">{dict.detail.chooseDivision}</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{dict.detail.divisionsIntro}</p>
        <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cup.divisions.map(division => <DivisionCard key={division.id} division={division} cup={cup} locale={locale} slug={slug} dict={dict} />)}
        </div>
      </section>
    </>
  )
}
