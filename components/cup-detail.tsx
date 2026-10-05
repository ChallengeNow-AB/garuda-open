import Link from 'next/link'
import Image from 'next/image'
import { CUP_BANNER, CUP_ID } from '@/lib/brand'
import { ArrowDown, ArrowLeft, CalendarDays, Clock3, Layers3 } from 'lucide-react'
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
  return (
    <>
      <section id={landing ? 'competitions' : undefined} className="scroll-mt-24 bg-hero text-white">
        {cup.id === CUP_ID && <div className="page-container pt-5 sm:pt-8">
          <Image src={CUP_BANNER} alt="Garuda Open 2026 — Badminton doubles tournament, 6 December 2026, 10:00, Sollentuna Rackethall"
            width={1672} height={941} sizes="(max-width: 1152px) 100vw, 1088px" priority
            className="h-auto w-full rounded-xl" />
        </div>}
        <div className="page-container grid items-center gap-6 py-8 sm:py-10">
          <div className="min-w-0">
            {!landing && <Link href={`/${locale}/${slug}#competitions`} className="inline-flex items-center gap-2 text-sm font-bold text-white/70 transition hover:text-white"><ArrowLeft size={17} />{locale === 'sv' ? 'Till cupsidan' : 'Back to the cup'}</Link>}
            <span className="mt-5 block w-fit rounded-full bg-accent px-4 py-2 text-xs font-black uppercase tracking-widest text-ink">{dict.detail.cup}</span>
            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-[-.04em] sm:text-4xl">{cup.title}</h1>
            {storefront?.branding.tagline && <p className="mt-4 max-w-2xl whitespace-pre-line text-base leading-relaxed text-white/75">{storefront.branding.tagline}</p>}
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-4 text-sm font-bold text-white/80">
              <span className="inline-flex items-center gap-2"><CalendarDays size={18} className="text-accent" />{date(cup.startDate, locale)}{cup.endDate && cup.endDate !== cup.startDate ? ` – ${date(cup.endDate, locale)}` : ''}</span>
              <span className="inline-flex items-center gap-2"><Layers3 size={18} className="text-accent" />{cup.divisions.length} {dict.common.divisions}</span>
              {cup.registrationDeadline && <span className="inline-flex items-center gap-2"><Clock3 size={18} className="text-accent" />{dict.detail.registrationDeadline}: {date(cup.registrationDeadline, locale)}</span>}
            </div>
            <a href="#registration" className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-ink transition hover:bg-white">
              {registrationOpen ? dict.common.chooseDivision : dict.detail.chooseDivision}<ArrowDown size={16} />
            </a>
          </div>
          {cup.id !== CUP_ID && <div className="h-32 overflow-hidden rounded-xl sm:h-40 md:h-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cup.imageUrl || storefront?.branding.coverImageUrl || '/badminton.jpg'} alt="" className="h-full w-full object-cover" />
          </div>}
        </div>
      </section>
      <CupInformation cup={cup} activities={storefront?.tournaments} locale={locale} dict={dict} />
      <section id="registration" aria-labelledby="registration-heading" className="page-container scroll-mt-24 py-10 sm:py-12">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-card sm:p-8">
          <h2 id="registration-heading" className="mb-6 text-2xl font-bold text-ink">{dict.detail.register}</h2>
          <CupRegistrationForm cupTitle={cup.title} currency={cup.currency} fallbackPrice={cup.price} divisions={cup.divisions} registrationOpen={registrationOpen} locale={locale} dict={dict} />
        </div>
      </section>
    </>
  )
}
