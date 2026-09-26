import type { League } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { formatPrice } from '@/lib/format'
import Link from 'next/link'
import { ArrowUpRight, CalendarRange, MapPin, Trophy } from 'lucide-react'

function formatEpoch(value: number | undefined, locale: Locale) {
  if (!value) return null
  return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(value))
}

export function LeagueCard({ league, locale, slug, dict }: { league: League; locale: Locale; slug: string; dict: Dictionary }) {
  const start = formatEpoch(league.startDate, locale)
  const end = formatEpoch(league.endDate, locale)
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-card-hover">
      <div className="relative h-44 overflow-hidden bg-ink">
        {league.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={league.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-ink"><Trophy size={42} className="text-white/75" /></div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-foreground shadow-sm backdrop-blur">{league.category ?? dict.common.league}</span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-xl font-black tracking-tight">{league.name}</h3>
        {league.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{league.description}</p>}
        <div className="mt-5 space-y-2 text-sm font-semibold text-muted-foreground">
          {league.locality && <p className="flex items-center gap-2"><MapPin size={15} className="text-brand" />{league.locality}</p>}
          {(start || end) && <p className="flex items-center gap-2"><CalendarRange size={15} className="text-brand" />{start}{end ? ` – ${end}` : ''}</p>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-border pt-5">
          <div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{dict.common.from}</p><p className="mt-0.5 font-black">{formatPrice(league.fee, league.currency, dict.common.free)}</p></div>
          <Link href={`/${locale}/${slug}/league/${league.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-black text-white transition hover:bg-brand">{dict.common.viewDetails}<ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </article>
  )
}
