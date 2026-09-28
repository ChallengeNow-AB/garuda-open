import Link from 'next/link'
import { ArrowLeft, CalendarDays, Clock3, Layers3 } from 'lucide-react'
import type { Cup } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { CupRegistrationForm } from '@/components/cup-registration-form'

function date(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}

export function CupDetail({ cup, locale, slug, dict }: { cup: Cup; locale: Locale; slug: string; dict: Dictionary }) {
  const today = new Date().setHours(0, 0, 0, 0)
  const registrationOpen = (!cup.registrationDeadline || new Date(cup.registrationDeadline).getTime() >= today) && new Date(cup.endDate || cup.startDate).getTime() >= today
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
      <section id="registration" className="scroll-mt-8 border-t border-border bg-white">
        <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-16 sm:px-10 sm:py-20 lg:grid-cols-[.7fr_1.3fr] lg:px-16 xl:px-24">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-brand">{dict.detail.registration.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-ink sm:text-5xl">{dict.detail.registration.title}</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">{dict.detail.registration.description}</p>
          </div>
          <CupRegistrationForm cupTitle={cup.title} currency={cup.currency} fallbackPrice={cup.price} divisions={cup.divisions} registrationOpen={registrationOpen} locale={locale} dict={dict} />
        </div>
      </section>
    </>
  )
}
