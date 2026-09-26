import type { Storefront } from '@/lib/types'
import type { Dictionary } from '@/lib/i18n'
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react'

export function OrgHero({
  organization,
  branding,
  dict,
  primaryHref,
  competitionCount,
}: {
  organization: Storefront['organization']
  branding: Storefront['branding']
  dict: Dictionary
  primaryHref: string
  competitionCount: number
}) {
  return (
    <section className="overflow-hidden bg-hero text-white">
      <div className="mx-auto grid min-h-[650px] max-w-[1500px] lg:grid-cols-[.95fr_1.05fr]">
        <div className="relative flex items-center px-5 py-16 sm:px-10 lg:px-16 lg:py-20 xl:pl-24">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[.24em] text-accent">
              <span className="h-2 w-2 rounded-full bg-accent" />
              {dict.org.kicker}
            </div>
            <h1 className="mt-8 text-[clamp(3.5rem,7.4vw,7.8rem)] font-black leading-[.92] tracking-[-.075em]">
              {dict.org.heroTitle}
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-white/76 sm:text-xl">
              {branding.tagline || dict.org.defaultTagline}
            </p>
            {organization.address?.city && (
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/55">
                <MapPin size={16} />{organization.address.city}
              </p>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <a href={primaryHref} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-black text-ink transition hover:-translate-y-0.5 hover:bg-white">
                {dict.org.explore}<ArrowDown size={17} />
              </a>
              <a href="#join" className="inline-flex items-center gap-2 rounded-full border border-white/35 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
                {dict.org.playerCta}<ArrowUpRight size={16} />
              </a>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-white/20 pt-6 text-xs font-bold uppercase tracking-[.16em] text-white/50">
              <span>{dict.org.heroTagOne}</span>
              <span>{dict.org.heroTagTwo}</span>
              {competitionCount > 0 && <span>{competitionCount} {dict.org.competitionsCount}</span>}
            </div>
          </div>
        </div>
        <div className="relative min-h-[440px] overflow-hidden lg:min-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/badminton_player_female.jpg" alt={dict.org.heroImageAlt} className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#102e35]/65 via-transparent to-[#102e35]/5 lg:bg-gradient-to-r lg:from-[#102e35]/25 lg:via-transparent" />
          <div className="absolute bottom-8 left-5 rounded-2xl border border-white/30 bg-white/90 px-5 py-4 text-ink shadow-xl backdrop-blur sm:left-10 lg:bottom-12 lg:left-12">
            <span className="block text-[10px] font-black uppercase tracking-[.22em] text-brand">{dict.org.photoEyebrow}</span>
            <span className="mt-1 block text-lg font-black">{dict.org.photoTitle}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
