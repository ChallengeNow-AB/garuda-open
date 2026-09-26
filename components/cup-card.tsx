import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Layers3, Ticket } from 'lucide-react'
import type { Cup } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { formatPrice } from '@/lib/format'

export function CupCard({ cup, locale, slug, dict }: { cup: Cup; locale: Locale; slug: string; dict: Dictionary }) {
  const date = new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(cup.startDate))
  const prices = cup.divisions.map(division => division.price ?? cup.price).filter((price): price is number => price != null)
  const fromPrice = prices.length ? Math.min(...prices) : cup.price
  const open = cup.divisions.some(division => !division.registrationClosed && (division.capacity == null || division.joined < division.capacity))

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="relative h-52 overflow-hidden bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cup.imageUrl || '/badminton.jpg'} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1.5 text-xs font-black uppercase tracking-wider text-ink">{dict.common.cup}</span>
        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 text-sm font-bold text-white"><Layers3 size={16} />{cup.divisions.length} {dict.common.divisions}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-2xl font-black tracking-[-.04em] text-ink">{cup.title}</h3>
          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${open ? 'bg-brand' : 'bg-muted-foreground'}`} title={open ? dict.common.open : dict.common.closed} />
        </div>
        {cup.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{cup.description}</p>}
        <div className="mt-6 space-y-2 text-sm font-semibold text-muted-foreground">
          <p className="flex items-center gap-2"><CalendarDays size={16} className="text-brand" />{date}</p>
          <p className="flex items-center gap-2"><Ticket size={16} className="text-brand" />{dict.common.from} {formatPrice(fromPrice, cup.currency, dict.common.free)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-5">
          <span className="text-xs font-bold uppercase tracking-wide text-brand">{cup.category || 'Badminton'}</span>
          <Link href={`/${locale}/${slug}/cup/${cup.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand">{dict.common.chooseDivision}<ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </article>
  )
}
