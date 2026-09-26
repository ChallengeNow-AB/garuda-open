import type { Activity } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { RegistrationTarget } from '@/lib/registration'
import { formatPrice, formatWhen } from '@/lib/format'
import Link from 'next/link'
import { ArrowUpRight, CalendarDays, MapPin, Ticket, Trophy } from 'lucide-react'

export function EventCard({ activity, kind, locale, slug, dict }: { activity: Activity; kind: RegistrationTarget; locale: Locale; slug: string; dict: Dictionary }) {
  const spotsLeft = activity.capacity != null ? Math.max(activity.capacity - (activity.joined ?? 0), 0) : null
  const isTournament = kind === 'tournament'
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-card-hover">
      <div className="relative h-44 overflow-hidden bg-muted">
        {activity.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={activity.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className={`flex h-full items-center justify-center ${isTournament ? 'bg-ink' : 'bg-brand-tint'}`}>
            {isTournament ? <Trophy size={38} className="text-white/80" /> : <CalendarDays size={38} className="text-brand/70" />}
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black shadow-sm backdrop-blur">{activity.category ?? (isTournament ? dict.common.tournament : dict.common.event)}</span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-xl font-black tracking-tight">{activity.title}</h3>
        {activity.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{activity.description}</p>}
        <div className="mt-5 space-y-2 text-sm font-semibold text-muted-foreground">
          <p className="flex items-center gap-2"><CalendarDays size={15} className="text-brand" />{formatWhen(activity.startDate, activity.startTime, locale)}</p>
          {activity.venueName && <p className="flex items-center gap-2"><MapPin size={15} className="text-brand" /><span className="truncate">{activity.venueName}</span></p>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-border pt-5">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-black"><Ticket size={14} className="text-brand" />{formatPrice(activity.price, activity.currency, dict.common.free)}</p>
            {spotsLeft != null && <p className="mt-1 text-xs font-bold text-muted-foreground">{spotsLeft} {dict.common.spotsLeft}</p>}
          </div>
          <Link href={`/${locale}/${slug}/${isTournament ? 'tournament' : 'activity'}/${activity.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-black text-white transition hover:bg-brand">{dict.common.viewDetails}<ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </article>
  )
}
