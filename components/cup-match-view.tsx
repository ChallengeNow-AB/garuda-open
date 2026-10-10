import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import type { Cup, CupMatch } from '@/lib/types'
import type { Locale } from '@/lib/i18n'
import type { CupView } from '@/components/cup-detail'

const discardedStatuses = new Set(['CANCEL', 'REVOKED', 'DECLINED', 'OUTDATED'])

function hasScore(match: CupMatch): boolean {
  return match.homeGoals != null && match.awayGoals != null
}

function matchDate(timestamp: number, locale: Locale): string | null {
  if (!timestamp || !Number.isFinite(timestamp)) return null
  return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(timestamp))
}

export function CupMatchView({ cup, locale, view, feed, cupPath }: {
  cup: Cup
  locale: Locale
  view: Exclude<CupView, 'overview'>
  feed?: { matches: CupMatch[]; unavailable: boolean }
  cupPath: string
}) {
  const matches = (feed?.matches || []).filter(match => !discardedStatuses.has(match.status || ''))
  const visible = (view === 'results' ? matches.filter(hasScore) : matches.filter(match => !hasScore(match)))
    .sort((left, right) => left.startDateTime - right.startDateTime)
  const groups = cup.divisions.map(division => ({
    division,
    matches: visible.filter(match => match.divisionId === division.id),
  })).filter(group => group.matches.length > 0)
  const isResults = view === 'results'

  return <section className="bg-white py-12 sm:py-16">
    <div className="page-container max-w-5xl">
      <p className="text-xs font-black uppercase tracking-[.22em] text-brand">{cup.title}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">{isResults ? (locale === 'sv' ? 'Resultat' : 'Results') : (locale === 'sv' ? 'Matcher' : 'Matches')}</h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{isResults
        ? (locale === 'sv' ? 'Publicerade matchresultat per klass. Resultat som ännu inte verifierats markeras tydligt.' : 'Published match scores by division. Scores awaiting verification are clearly marked.')
        : (locale === 'sv' ? 'Se kommande och pågående matcher per klass. Schemat uppdateras när arrangören publicerar nya matcher.' : 'See scheduled and ongoing matches by division. The schedule updates when the organizer publishes matches.')}</p>
      <nav aria-label={locale === 'sv' ? 'Tävlingsvyer' : 'Competition views'} className="mt-8 flex gap-2 border-b border-border">
        <Link href={`${cupPath}?view=matches`} aria-current={!isResults ? 'page' : undefined} className={`border-b-[3px] px-4 py-3 text-sm font-bold ${!isResults ? 'border-brand text-brand' : 'border-transparent text-muted-foreground hover:text-brand'}`}>{locale === 'sv' ? 'Matcher' : 'Matches'}</Link>
        <Link href={`${cupPath}?view=results`} aria-current={isResults ? 'page' : undefined} className={`border-b-[3px] px-4 py-3 text-sm font-bold ${isResults ? 'border-brand text-brand' : 'border-transparent text-muted-foreground hover:text-brand'}`}>{locale === 'sv' ? 'Resultat' : 'Results'}</Link>
      </nav>

      {feed?.unavailable && <p role="status" className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{locale === 'sv' ? 'Några klasser kunde inte laddas just nu. Försök igen om en stund.' : 'Some divisions could not be loaded right now. Please try again shortly.'}</p>}
      {groups.length ? <div className="mt-8 space-y-9">
        {groups.map(({ division, matches: divisionMatches }) => <section key={division.id} aria-labelledby={`division-${division.id}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
            <h3 id={`division-${division.id}`} className="text-xl font-black text-ink">{division.title}</h3>
            <span className="text-sm text-muted-foreground">{divisionMatches.length} {locale === 'sv' ? 'matcher' : 'matches'}</span>
          </div>
          <ol className="divide-y divide-border">
            {divisionMatches.map(match => <li key={match.id} className="grid gap-3 py-5 sm:grid-cols-[180px_1fr_auto] sm:items-center sm:gap-6">
              <div className="text-sm text-muted-foreground">
                {matchDate(match.startDateTime, locale) && <span className="inline-flex items-center gap-2"><CalendarDays size={16} />{matchDate(match.startDateTime, locale)}</span>}
                {match.venueName && <span className="mt-1 flex items-center gap-2"><MapPin size={16} />{match.venueName}</span>}
              </div>
              <div className="min-w-0 text-base font-semibold text-ink">
                <span>{match.homeTeam.name}</span><span className="mx-2 text-muted-foreground">–</span><span>{match.awayTeam?.name || (locale === 'sv' ? 'Motståndare ej klar' : 'Opponent TBD')}</span>
                {match.round > 0 && <span className="mt-1 block text-xs font-normal text-muted-foreground">{locale === 'sv' ? 'Omgång' : 'Round'} {match.round}</span>}
              </div>
              {hasScore(match) ? <div className="sm:text-right"><strong className="text-xl font-black tabular-nums text-ink">{match.homeGoals}–{match.awayGoals}</strong><span className="block text-xs text-muted-foreground">{match.verifiedResult ? (locale === 'sv' ? 'Verifierat' : 'Verified') : (locale === 'sv' ? 'Inväntar verifiering' : 'Awaiting verification')}</span></div>
                : <span className="text-sm font-semibold text-brand sm:text-right">{match.status === 'PLAYED'
                  ? (locale === 'sv' ? 'Resultat inväntas' : 'Result pending')
                  : (locale === 'sv' ? 'Schemalagd' : 'Scheduled')}</span>}
            </li>)}
          </ol>
        </section>)}
      </div> : feed?.unavailable ? <div className="mt-9 border-y border-border py-12 text-center">
        <h3 className="text-xl font-bold text-ink">{locale === 'sv' ? 'Vi kan inte visa matcherna just nu' : 'We cannot show the matches right now'}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{locale === 'sv' ? 'Försök igen om en stund.' : 'Please try again shortly.'}</p>
      </div> : <div className="mt-9 border-y border-border py-12 text-center">
        <h3 className="text-xl font-bold text-ink">{isResults
          ? (locale === 'sv' ? 'Inga resultat publicerade ännu' : 'No results published yet')
          : (locale === 'sv' ? 'Inget spelschema publicerat ännu' : 'No match schedule published yet')}</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{isResults
          ? (locale === 'sv' ? 'Resultaten visas här när matcher har spelats och registrerats.' : 'Results will appear here after matches have been played and recorded.')
          : (locale === 'sv' ? 'Titta tillbaka när arrangören har lagt upp matcherna.' : 'Check back once the organizer has added the matches.')}</p>
      </div>}
      <Link href={`${cupPath}#registration`} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline">{locale === 'sv' ? 'Till anmälan' : 'Go to registration'}<ArrowRight size={16} /></Link>
    </div>
  </section>
}
