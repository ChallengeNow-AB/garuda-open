import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarDays, MapPin, Layers3 } from 'lucide-react'
import type { Cup, CupMatch, Storefront } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { formatPrice } from '@/lib/format'
import { CUP_ID, STOREFRONT_NAME } from '@/lib/brand'
import { CupRegistrationForm } from '@/components/cup-registration-form'
import { CupInformation } from '@/components/cup-information'
import { CupMatchView } from '@/components/cup-match-view'

export type CupView = 'overview' | 'matches' | 'results'

function date(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', { timeZone: 'Europe/Stockholm', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00Z`))
}

export function CupDetail({ cup, locale, slug, dict, landing = false, storefront, view = 'overview', feed }: {
  cup: Cup
  locale: Locale
  slug: string
  dict: Dictionary
  landing?: boolean
  storefront?: Storefront
  view?: CupView
  feed?: { matches: CupMatch[]; unavailable: boolean }
}) {
  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  // API dates are date-only values. The deadline is inclusive in the cup's local time zone.
  const registrationOpen = (!cup.registrationDeadline || cup.registrationDeadline >= today)
    && (cup.endDate || cup.startDate) >= today
  const venue = storefront?.tournaments.find(activity => activity.cupId === cup.id)?.venueName
  const prices = cup.divisions.map(division => division.price ?? cup.price).filter((price): price is number => price != null)
  const fee = prices.length ? `${dict.common.from} ${formatPrice(Math.min(...prices), cup.currency, dict.common.free)}` : undefined
  const cupPath = landing ? `/${locale}/${slug}` : `/${locale}/${slug}/cup/${cup.id}`
  const isGaruda = cup.id === CUP_ID
  const intro = isGaruda
    ? (locale === 'sv' ? 'Välj en dubbelklass som passar er och anmäl er till Garuda Open.' : 'Choose the doubles class that fits your pair and enter Garuda Open.')
    : cup.description?.trim()

  return <>
    {view === 'overview' && <section id="competitions" className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 hidden md:block">
        <Image src={isGaruda ? '/garuda-hero-light.png' : cup.imageUrl || storefront?.branding.coverImageUrl || '/badminton.jpg'}
          alt="" fill sizes="100vw" priority className="object-cover object-center" />
      </div>
      <div className="page-container relative grid min-h-[455px] items-center gap-6 py-11 md:py-16">
        <div className="max-w-[560px]">
          <p className="text-xs font-black uppercase tracking-[.22em] text-brand">{cup.category || dict.detail.cup} · Stockholm</p>
          <h1 className="mt-5 text-[clamp(3.2rem,5.4vw,5.4rem)] font-black leading-[.98] tracking-[-.055em] text-ink">{cup.title}</h1>
          <p className="mt-5 text-base font-bold text-ink">{locale === 'sv' ? 'Arrangeras av' : 'Organized by'} {isGaruda ? STOREFRONT_NAME : storefront?.organization.name || STOREFRONT_NAME}</p>
          {intro && <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">{intro}</p>}
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink">
            <div className="flex items-start gap-2"><CalendarDays size={19} className="mt-0.5 text-brand" /><span><span className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{locale === 'sv' ? 'Datum' : 'Date'}</span><strong className="mt-1 block">{date(cup.startDate, locale)}</strong></span></div>
            <div className="flex items-start gap-2"><MapPin size={19} className="mt-0.5 text-brand" /><span><span className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{locale === 'sv' ? 'Plats' : 'Venue'}</span><strong className="mt-1 block">{venue || (locale === 'sv' ? 'Meddelas senare' : 'To be announced')}</strong></span></div>
            {fee && <div className="flex items-start gap-2"><Layers3 size={19} className="mt-0.5 text-brand" /><span><span className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{locale === 'sv' ? 'Avgift' : 'Entry fee'}</span><strong className="mt-1 block">{fee}</strong></span></div>}
          </div>
          {registrationOpen && <Link href={`${cupPath}#registration`} className="mt-8 inline-flex min-h-13 items-center gap-4 rounded-full bg-accent px-7 py-3 text-base font-black text-ink transition hover:bg-[#cde759] focus-visible:outline-brand">{locale === 'sv' ? `Anmäl dig till ${cup.title}` : `Register for ${cup.title}`}<ArrowRight size={19} /></Link>}
        </div>
        <div className="relative -mx-5 -mb-11 mt-3 h-60 md:hidden">
          <Image src={isGaruda ? '/garuda-hero-light.png' : cup.imageUrl || storefront?.branding.coverImageUrl || '/badminton.jpg'} alt="" fill sizes="100vw" loading="eager" className="object-cover object-right" />
        </div>
      </div>
    </section>}

    {view === 'overview' ? <>
      <CupInformation cup={cup} activities={storefront?.tournaments} locale={locale} dict={dict} />
      <section id="registration" aria-labelledby="registration-heading" className="scroll-mt-24 bg-white py-12 sm:py-16">
        <div className="page-container">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[.22em] text-brand">{locale === 'sv' ? 'Anmälan' : 'Registration'}</p>
            <h2 id="registration-heading" className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">{locale === 'sv' ? `Anmäl dig till ${cup.title}` : `Register for ${cup.title}`}</h2>
            <p className="mt-2 text-base text-muted-foreground">{locale === 'sv' ? 'Välj din klass och fyll i dina uppgifter.' : 'Choose your division and add your details.'}</p>
          </div>
          <div className="mt-9">
            <CupRegistrationForm cupTitle={cup.title} currency={cup.currency} fallbackPrice={cup.price}
              divisions={cup.divisions} registrationOpen={registrationOpen} locale={locale} dict={dict} guidedDoubles={isGaruda} />
          </div>
        </div>
      </section>
      <section className="border-t border-border bg-[#f6faf8] py-10 sm:py-12">
        <div className="page-container grid items-center gap-6 md:grid-cols-[1fr_.9fr] md:gap-12">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-ink">{locale === 'sv' ? 'Matcher och resultat' : 'Matches & results'}</h2>
            <p className="mt-2 max-w-md text-base text-muted-foreground">{locale === 'sv' ? 'Följ spelschemat och se resultaten här när de finns publicerade.' : 'Follow the match schedule and see results here when they are published.'}</p>
            <Link href={`${cupPath}?view=matches`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-tint px-5 py-3 text-sm font-bold text-brand transition hover:bg-[#cdece7]">{locale === 'sv' ? 'Visa matcher och resultat' : 'View matches and results'}<ArrowRight size={17} /></Link>
          </div>
          <div className="relative h-44 overflow-hidden rounded-2xl sm:h-52"><Image src="/shuttlecock-court.png" alt="" fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" /></div>
        </div>
      </section>
    </> : <CupMatchView cup={cup} locale={locale} view={view} feed={feed} cupPath={cupPath} />}
  </>
}
