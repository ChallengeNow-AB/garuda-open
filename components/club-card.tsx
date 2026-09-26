import Link from 'next/link'
import type { Club } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { ArrowUpRight, MapPin } from 'lucide-react'

export function ClubCard({ club, locale, dict }: { club: Club; locale: Locale; dict: Dictionary }) {
  return (
    <Link
      href={`/${locale}/${club.slug}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md sm:p-5"
    >
      {club.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={club.logoUrl}
          alt=""
          className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
        />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-xl font-bold text-brand">
          {club.name[0]?.toUpperCase() ?? '?'}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold">{club.name}</h3>
        {club.city && (
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin size={13} className="shrink-0" />
            {club.city}
          </p>
        )}
      </div>

      <span className="flex items-center gap-1 text-sm font-semibold text-brand opacity-0 transition group-hover:opacity-100">
        {dict.common.viewClub}
        <ArrowUpRight size={15} />
      </span>
    </Link>
  )
}
