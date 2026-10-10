import Link from 'next/link'
import Image from 'next/image'
import { CUP_ID } from '@/lib/brand'
import { ArrowDown, ArrowLeft, CalendarDays, Layers3, MapPin } from 'lucide-react'
import type { Cup, Storefront } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { CupRegistrationForm } from '@/components/cup-registration-form'
import { CupInformation } from '@/components/cup-information'

function date(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}

export function CupDetail({ cup, locale, slug, dict, landing = false, storefront }: { cup: Cup; locale: Locale; slug: string; dict: Dictionary; landing?: boolean; storefront?: Storefront }) {
  const today = new Date().setHours(0, 0, 0, 0)
  const registrationOpen = (!cup.registrationDeadline || new Date(cup.registrationDeadline).getTime() >= today) && new Date(cup.endDate || cup.startDate).getTime() >= today
  const venue = storefront?.tournaments.find(activity => activity.cupId === cup.id)?.venueName
  return (
    <>
      <section id={landing ? 'competitions' : undefined} className="scroll-mt-24 bg-white">
        <div className="page-container grid items-center gap-8 py-10 sm:py-16 lg:grid-cols-[1.06fr_.94fr] lg:gap-12 lg:py-20">
          <div className="min-w-0">
            {!landing && <Link href={`/${locale}/${slug}#competitions`} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"><ArrowLeft size={17} />{locale === 'sv' ? 'Till cupsidan' : 'Back to the cup'}</Link>}
            <p className="text-xs font-black uppercase tracking-[.22em] text-brand">{cup.category || dict.detail.cup} · Stockholm</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[.98] tracking-[-.055em] text-ink sm:text-6xl lg:text-[clamp(4rem,5vw,5.5rem)]">{cup.title}</h1>
            <p className="mt-5 text-base font-semibold text-brand">{locale === 'sv' ? 'Arrangeras av' : 'Organized by'} Komunitas Badminton Stockholm</p>
            {storefront?.branding.tagline && <p className="mt-5 max-w-xl whitespace-pre-line text-base leading-relaxed text-muted-foreground">{storefront.branding.tagline}</p>}
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-ink">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-tint px-4 py-2"><CalendarDays size={17} className="text-brand" />{date(cup.startDate, locale)}{cup.endDate && cup.endDate !== cup.startDate ? ` – ${date(cup.endDate, locale)}` : ''}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-tint px-4 py-2"><Layers3 size={17} className="text-brand" />{cup.divisions.length} {dict.common.divisions}</span>
            </div>
            {registrationOpen && <a href="#registration" className="mt-9 inline-flex min-h-14 items-center gap-4 rounded-full bg-accent px-7 text-base font-black text-ink transition hover:bg-[#cde759] focus-visible:outline-brand">{locale === 'sv' ? 'Välj en klass' : 'Choose a division'}<ArrowDown size={19} /></a>}
          </div>
          <div className="relative min-h-[330px] overflow-hidden rounded-[1.5rem] bg-brand-tint sm:min-h-[470px] lg:min-h-[520px]">
            <Image src={cup.id === CUP_ID ? '/garuda-hero-light.png' : cup.imageUrl || storefront?.branding.coverImageUrl || '/badminton.jpg'}
              alt={cup.id === CUP_ID ? (locale === 'sv' ? 'Garuda-maskoten på badmintonbanan' : 'Garuda mascot on a badminton court') : ''}
              fill sizes="(max-width: 1024px) 100vw, 520px" priority className="object-cover object-right" />
          </div>
        </div>
        <div className="border-y border-border bg-[#f7faf7]">
          <div className="page-container grid gap-5 py-6 text-sm sm:grid-cols-3 sm:gap-8">
            <div className="flex items-start gap-3"><CalendarDays size={20} className="mt-1 shrink-0 text-brand" /><span><span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">{locale === 'sv' ? 'Datum' : 'Date'}</span><strong className="mt-1 block text-ink">{date(cup.startDate, locale)}</strong></span></div>
            <div className="flex items-start gap-3"><MapPin size={20} className="mt-1 shrink-0 text-brand" /><span><span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">{locale === 'sv' ? 'Spelplats' : 'Venue'}</span><strong className="mt-1 block text-ink">{venue || (locale === 'sv' ? 'Meddelas av arrangören' : 'To be announced by organizer')}</strong></span></div>
            <div className="flex items-start gap-3"><Layers3 size={20} className="mt-1 shrink-0 text-brand" /><span><span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">{locale === 'sv' ? 'Arrangör' : 'Organizer'}</span><strong className="mt-1 block text-ink">Komunitas Badminton Stockholm</strong></span></div>
          </div>
        </div>
      </section>
      <section id="registration" aria-labelledby="registration-heading" className="page-container scroll-mt-24 py-12 sm:py-16">
        <p className="text-xs font-black uppercase tracking-[.22em] text-brand">{locale === 'sv' ? 'Anmälan' : 'Registration'}</p>
        <h2 id="registration-heading" className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">{locale === 'sv' ? 'Välj din klass' : 'Choose your division'}</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{dict.detail.divisionsIntro}</p>
        <div className="mt-8">
          <CupRegistrationForm cupTitle={cup.title} currency={cup.currency} fallbackPrice={cup.price} divisions={cup.divisions} registrationOpen={registrationOpen} locale={locale} dict={dict} />
        </div>
      </section>
      <CupInformation cup={cup} activities={storefront?.tournaments} locale={locale} dict={dict} />
    </>
  )
}
