import type { Activity, Cup } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { formatPrice, formatWhen } from '@/lib/format'

export function CupInformation({ cup, activities = [], locale, dict }: {
  cup: Cup; activities?: Activity[]; locale: Locale; dict: Dictionary
}) {
  const labels = locale === 'sv' ? {
    title: 'Om cupen', sport: 'Sport', fee: 'Anmälningsavgift', categories: 'Kategorier',
    levels: 'Nivåer', starts: 'Starttider för klasserna', venues: 'Spelplatser',
    feeNote: 'Avgiften beror på vilken klass du väljer.',
    genders: { MALE: 'Herr', FEMALE: 'Dam', MIXED: 'Mixed', OPEN: 'Öppen' },
    skills: { BEGINNER: 'Nybörjare', INTERMEDIATE: 'Medel', ADVANCED: 'Avancerad', ELITE: 'Elit', ALL: 'Alla nivåer' },
  } : {
    title: 'About the cup', sport: 'Sport', fee: 'Entry fee', categories: 'Categories',
    levels: 'Levels', starts: 'Division start times', venues: 'Venues',
    feeNote: 'The fee depends on your selected division.',
    genders: { MALE: 'Men', FEMALE: 'Women', MIXED: 'Mixed', OPEN: 'Open' },
    skills: { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced', ELITE: 'Elite', ALL: 'All levels' },
  }
  const unique = (values: (string | undefined)[]) => [...new Set(values.filter((value): value is string => Boolean(value)))]
  const translate = (values: string[], translations: Record<string, string>) => values.map(value => translations[value] || value).join(' · ')
  const prices = cup.divisions.map(division => division.price ?? cup.price).filter((price): price is number => price != null)
  if (!prices.length && cup.price != null) prices.push(cup.price)
  const cupActivities = activities.filter(activity => activity.cupId === cup.id)
  const starts = unique(cupActivities.filter(activity => activity.startDate && activity.startTime).map(activity => formatWhen(activity.startDate, activity.startTime, locale)))
  // An organizer address is not necessarily the competition venue.
  const venues = unique(cupActivities.map(activity => [activity.venueName, activity.address?.street, activity.address?.postCode, activity.address?.city].filter(Boolean).join(', ')))
  const facts = [
    { label: labels.sport, value: cup.category },
    { label: labels.fee, value: prices.length ? `${dict.common.from} ${formatPrice(Math.min(...prices), cup.currency, dict.common.free)}` : undefined },
    { label: labels.categories, value: translate(unique(cup.divisions.map(division => division.targetGender)), labels.genders) },
    { label: labels.levels, value: translate(unique(cup.divisions.map(division => division.skillLevel)), labels.skills) },
    { label: labels.starts, value: starts.join(' · ') },
    { label: labels.venues, value: venues.join(' · ') },
  ].filter(fact => fact.value)
  if (!cup.description?.trim() && !facts.length) return null

  return (
    <section aria-labelledby="cup-information-heading" className="page-container pt-10 sm:pt-12">
      <h2 id="cup-information-heading" className="text-2xl font-bold tracking-tight">{labels.title}</h2>
      {cup.description?.trim() && <p className="mt-5 max-w-prose whitespace-pre-line break-words leading-relaxed text-muted-foreground">{cup.description}</p>}
      <dl className="mt-6 grid gap-x-8 gap-y-6 border-y border-border py-6 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map(fact => <div key={fact.label} className="min-w-0">
          <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{fact.label}</dt>
          <dd className="mt-2 break-words text-base font-semibold text-ink">{fact.value}</dd>
        </div>)}
      </dl>
      {prices.length > 1 && new Set(prices).size > 1 && <p className="mt-3 text-sm text-muted-foreground">{labels.feeNote}</p>}
    </section>
  )
}
