import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin, Trophy } from 'lucide-react'
import type { Cup, DivisionFeed, GroupSummary, MatchSummary } from '@/lib/types'
import type { Locale } from '@/lib/i18n'
import type { CupFeed } from '@/lib/api'
import type { CupView } from '@/components/cup-detail'
import {
  categoryLabel, decisionLabel, divisionLabel, divisionShortLabel, hasScore, isVisible, matchTime, roundLabel, winner, winnerSide,
} from '@/lib/tournament'

type MatchesView = Exclude<CupView, 'overview'>

/** A fixture plus where it belongs: which division, and which group or knockout round. */
type Entry = { match: MatchSummary; stage: string }

function totalRounds(feed: DivisionFeed): number {
  return feed.bracket?.totalRounds || Math.max(0, ...feed.knockout.map(match => match.round))
}

function entries(feed: DivisionFeed, locale: Locale): Entry[] {
  const sv = locale === 'sv'
  const rounds = totalRounds(feed)
  return [
    ...feed.groups.flatMap(group => group.matches.filter(isVisible).map(match => ({
      match, stage: group.name ? `${sv ? 'Grupp' : 'Group'} ${group.name}` : (sv ? 'Gruppspel' : 'Group stage'),
    }))),
    ...feed.knockout.filter(isVisible).map(match => ({ match, stage: roundLabel(match.round, rounds, locale) })),
  ]
}

export function CupMatchView({ cup, locale, view, feed, cupPath, divisionId }: {
  cup: Cup
  locale: Locale
  view: MatchesView
  feed?: CupFeed
  cupPath: string
  divisionId?: number
}) {
  const sv = locale === 'sv'
  const all = feed?.divisions ?? []
  const selected = all.find(item => item.division.id === divisionId)
  const scope = selected ? [selected] : all
  const href = (nextView: MatchesView, nextDivision = selected?.division.id) =>
    `${cupPath}?view=${nextView}${nextDivision ? `&division=${nextDivision}` : ''}`

  const heading = { matches: sv ? 'Matcher' : 'Matches', results: sv ? 'Resultat' : 'Results', bracket: sv ? 'Slutspel' : 'Knockout bracket' }[view]
  const intro = {
    matches: sv ? 'Kommande och pågående matcher i gruppspel och slutspel.' : 'Upcoming and ongoing matches in the group stage and knockout.',
    results: sv ? 'Gruppspelstabeller och spelade matcher per klass.' : 'Group tables and played matches by division.',
    bracket: sv ? 'Slutspelsträdet per klass — vinnaren går vidare tills en mästare är korad.' : 'The knockout tree for each division — winners advance until a champion is crowned.',
  }[view]

  return <section className="bg-white py-12 sm:py-16">
    <div className="page-container max-w-6xl">
      <p className="text-xs font-black uppercase tracking-[.22em] text-brand">{cup.title}</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">{heading}</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{intro}</p>

      <nav aria-label={sv ? 'Tävlingsvyer' : 'Competition views'} className="mt-8 inline-flex gap-1 rounded-full bg-muted p-1">
        {(['matches', 'results', 'bracket'] as const).map(item => (
          <Link key={item} href={href(item)} aria-current={view === item ? 'page' : undefined}
            className={`rounded-full px-4 py-2 text-sm font-bold transition sm:px-5 ${view === item ? 'bg-white text-brand shadow-sm' : 'text-ink/70 hover:text-ink'}`}>
            {{ matches: sv ? 'Matcher' : 'Matches', results: sv ? 'Resultat' : 'Results', bracket: sv ? 'Slutspel' : 'Bracket' }[item]}
          </Link>
        ))}
      </nav>

      {all.length > 1 && <DivisionPicker divisions={all} selectedId={selected?.division.id} locale={locale} href={id => href(view, id)} />}

      {feed?.unavailable && <p role="status" className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{sv ? 'Några klasser kunde inte laddas just nu. Försök igen om en stund.' : 'Some divisions could not be loaded right now. Please try again shortly.'}</p>}

      <div className="mt-8">
        {view === 'matches' && <MatchesList scope={scope} locale={locale} showDivision />}
        {view === 'results' && <ResultsList scope={scope} locale={locale} showDivision />}
        {view === 'bracket' && <Brackets scope={scope} locale={locale} showDivision />}
      </div>

      <Link href={`${cupPath}#registration`} className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline">{sv ? 'Till anmälan' : 'Go to registration'}<ArrowRight size={16} /></Link>
    </div>
  </section>
}

function DivisionPicker({ divisions, selectedId, locale, href }: {
  divisions: DivisionFeed[]; selectedId?: number; locale: Locale; href: (id?: number) => string
}) {
  const sv = locale === 'sv'
  const categories = [...new Set(divisions.map(item => item.division.targetGender ?? ''))]
  const chip = (active: boolean) => `rounded-full border px-3 py-1.5 text-xs font-bold transition sm:text-sm ${active
    ? 'border-brand bg-brand text-white' : 'border-border bg-white text-ink hover:border-brand hover:text-brand'}`
  return (
    <div className="mt-6 rounded-2xl bg-[#f6faf8] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{sv ? 'Klass' : 'Division'}</p>
        <Link href={href(undefined)} aria-current={!selectedId ? 'true' : undefined} className={chip(!selectedId)}>{sv ? 'Alla klasser' : 'All divisions'}</Link>
      </div>
      <div className="mt-3 grid gap-3">
        {categories.map(category => (
          <div key={category} className="grid gap-2 sm:grid-cols-[9.5rem_1fr] sm:items-center">
            <span className="text-sm font-bold text-ink">{categoryLabel(category || undefined, locale)}</span>
            <div className="flex flex-wrap gap-2">
              {divisions.filter(item => (item.division.targetGender ?? '') === category).map(({ division }) => (
                <Link key={division.id} href={href(division.id)} aria-current={selectedId === division.id ? 'true' : undefined} className={chip(selectedId === division.id)}>
                  {divisionShortLabel(division, locale)}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DivisionHeading({ feed, locale, count }: { feed: DivisionFeed; locale: Locale; count?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-xl font-black text-ink">{divisionLabel(feed.division, locale)}</h2>
      {count && <span className="text-sm text-muted-foreground">{count}</span>}
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-[#f6faf8] px-6 py-12 text-center">
      <Trophy size={30} className="mx-auto text-brand" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

function MatchesList({ scope, locale, showDivision }: { scope: DivisionFeed[]; locale: Locale; showDivision: boolean }) {
  const sv = locale === 'sv'
  const groups = scope.map(feed => ({
    feed,
    items: entries(feed, locale).filter(entry => !hasScore(entry.match)).sort((a, b) => a.match.startDateTime - b.match.startDateTime),
  })).filter(group => group.items.length > 0)
  if (!groups.length) return <EmptyState
    title={sv ? 'Inget spelschema publicerat ännu' : 'No match schedule published yet'}
    body={sv ? 'Matcherna visas här när arrangören har lottat grupperna och lagt upp spelschemat.' : 'Matches appear here once the organizer has drawn the groups and published the schedule.'} />
  return <div className="space-y-10">
    {groups.map(({ feed, items }) => <section key={feed.division.id}>
      {showDivision && <DivisionHeading feed={feed} locale={locale} count={`${items.length} ${sv ? 'matcher' : 'matches'}`} />}
      <div className="grid gap-3 lg:grid-cols-2">{items.map(entry => <MatchCard key={entry.match.id} entry={entry} locale={locale} />)}</div>
    </section>)}
  </div>
}

function ResultsList({ scope, locale, showDivision }: { scope: DivisionFeed[]; locale: Locale; showDivision: boolean }) {
  const sv = locale === 'sv'
  const sections = scope.map(feed => ({
    feed,
    tables: feed.groups.filter(group => group.standings.length > 0),
    played: entries(feed, locale).filter(entry => hasScore(entry.match)).sort((a, b) => b.match.startDateTime - a.match.startDateTime),
  })).filter(section => section.tables.length > 0 || section.played.length > 0)
  if (!sections.length) return <EmptyState
    title={sv ? 'Inga resultat publicerade ännu' : 'No results published yet'}
    body={sv ? 'Tabeller och resultat visas här när matcherna har spelats och registrerats.' : 'Tables and results appear here once matches have been played and recorded.'} />
  return <div className="space-y-12">
    {sections.map(({ feed, tables, played }) => <section key={feed.division.id}>
      {showDivision && <DivisionHeading feed={feed} locale={locale} />}
      {tables.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{tables.map(group => <GroupTable key={group.id} group={group} locale={locale} />)}</div>}
      {played.length > 0 && <>
        <h3 className="mb-3 mt-7 text-sm font-black uppercase tracking-widest text-muted-foreground">{sv ? 'Spelade matcher' : 'Played matches'}</h3>
        <div className="grid gap-3 lg:grid-cols-2">{played.map(entry => <MatchCard key={entry.match.id} entry={entry} locale={locale} />)}</div>
      </>}
    </section>)}
  </div>
}

function MatchCard({ entry: { match, stage }, locale }: { entry: Entry; locale: Locale }) {
  const sv = locale === 'sv'
  const side = winnerSide(match)
  const scored = hasScore(match)
  const when = matchTime(match.startDateTime, locale)
  const walkover = decisionLabel(match, locale)
  const row = (name: string | undefined, goals: number | null | undefined, penalties: number | null | undefined, won: boolean, lost: boolean) => (
    <div className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${won ? 'bg-brand-tint' : ''}`}>
      <span className={`min-w-0 truncate ${won ? 'font-black text-ink' : lost ? 'text-muted-foreground' : 'font-semibold text-ink'}`}>
        {name || <span className="italic text-muted-foreground">{sv ? 'Motståndare ej klar' : 'Opponent TBD'}</span>}
      </span>
      {scored && <span className={`shrink-0 tabular-nums ${won ? 'font-black text-brand' : 'font-bold text-ink/70'}`}>
        {goals ?? '–'}{penalties != null && <span className="ml-1 text-xs font-semibold text-muted-foreground">({penalties})</span>}
      </span>}
    </div>
  )
  return (
    <article className="rounded-2xl border border-border bg-white p-3 shadow-[0_1px_2px_rgba(12,46,53,.04)] sm:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <span className="rounded-full bg-muted px-2.5 py-1 font-bold text-ink">{stage}</span>
        <span className={`font-bold ${scored ? (match.verifiedResult ? 'text-brand' : 'text-amber-700') : 'text-muted-foreground'}`}>
          {walkover ?? (scored
            ? (match.verifiedResult ? (sv ? 'Slutresultat' : 'Final score') : (sv ? 'Inväntar verifiering' : 'Awaiting verification'))
            : match.status === 'PLAYED' ? (sv ? 'Resultat inväntas' : 'Result pending') : (sv ? 'Schemalagd' : 'Scheduled'))}
        </span>
      </div>
      <div className="grid gap-1">
        {row(match.homeTeam?.name, match.homeGoals, match.homePenalties, side === 'home', side === 'away')}
        {row(match.awayTeam?.name, match.awayGoals, match.awayPenalties, side === 'away', side === 'home')}
      </div>
      {(when || match.venueName) && <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
        {when && <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} aria-hidden="true" />{when}</span>}
        {match.venueName && <span className="inline-flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" />{match.venueName}</span>}
      </div>}
    </article>
  )
}

function GroupTable({ group, locale }: { group: GroupSummary; locale: Locale }) {
  const sv = locale === 'sv'
  const showDrawn = group.standings.some(row => row.drawn > 0)
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex items-center justify-between gap-3 bg-[#f6faf8] px-4 py-3">
        <h3 className="font-black text-ink">{group.name ? `${sv ? 'Grupp' : 'Group'} ${group.name}` : (sv ? 'Gruppspel' : 'Group stage')}</h3>
        {group.advanceCount > 0 && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-brand" aria-hidden="true" />{sv ? `Topp ${group.advanceCount} till slutspel` : `Top ${group.advanceCount} advance`}
        </span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] text-sm">
          <thead className="text-left text-[11px] font-black uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2 pl-4 pr-2">#</th>
              <th className="w-full px-2 py-2">{sv ? 'Lag' : 'Team'}</th>
              <th className="px-2 py-2 text-center" title={sv ? 'Spelade' : 'Played'}>{sv ? 'S' : 'P'}</th>
              <th className="px-2 py-2 text-center" title={sv ? 'Vinster' : 'Won'}>{sv ? 'V' : 'W'}</th>
              {showDrawn && <th className="px-2 py-2 text-center" title={sv ? 'Oavgjorda' : 'Drawn'}>{sv ? 'O' : 'D'}</th>}
              <th className="px-2 py-2 text-center" title={sv ? 'Förluster' : 'Lost'}>{sv ? 'F' : 'L'}</th>
              <th className="px-2 py-2 text-center">+/-</th>
              <th className="py-2 pl-2 pr-4 text-right">{sv ? 'P' : 'Pts'}</th>
            </tr>
          </thead>
          <tbody>
            {group.standings.map((row, index) => {
              const advances = index < group.advanceCount
              return <tr key={row.teamId} className={index > 0 ? 'border-t border-border' : ''}>
                <td className="py-2.5 pl-4 pr-2">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${advances ? 'bg-brand text-white' : 'bg-muted text-ink'}`}>{index + 1}</span>
                </td>
                <td className="max-w-0 truncate px-2 py-2.5 font-bold text-ink">{row.teamName}</td>
                <td className="px-2 py-2.5 text-center tabular-nums">{row.played}</td>
                <td className="px-2 py-2.5 text-center tabular-nums">{row.won}</td>
                {showDrawn && <td className="px-2 py-2.5 text-center tabular-nums">{row.drawn}</td>}
                <td className="px-2 py-2.5 text-center tabular-nums">{row.lost}</td>
                <td className="px-2 py-2.5 text-center tabular-nums">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                <td className="py-2.5 pl-2 pr-4 text-right font-black tabular-nums text-ink">{row.points}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Brackets({ scope, locale, showDivision }: { scope: DivisionFeed[]; locale: Locale; showDivision: boolean }) {
  const sv = locale === 'sv'
  const withTree = scope.filter(feed => totalRounds(feed) > 0)
  if (!withTree.length) return <EmptyState
    title={sv ? 'Slutspelet är inte lottat ännu' : 'The knockout has not been drawn yet'}
    body={sv ? 'Trädet visas här när gruppspelet är klart och slutspelet har lottats.' : 'The tree appears here once the group stage is over and the knockout has been drawn.'} />
  return <div className="space-y-12">
    {withTree.map(feed => <section key={feed.division.id}>
      {showDivision && <DivisionHeading feed={feed} locale={locale} />}
      <BracketTree feed={feed} locale={locale} />
    </section>)}
  </div>
}

/** Height of one first-round slot; every later round spreads its matches over the same height. */
const SLOT = 92

/**
 * Knockout tree. Round r has 2^(total − r) slots; slots 2k and 2k+1 feed slot k of the next round, so
 * each pair of matches is wrapped and joined by a bracket line to the match it feeds.
 */
function BracketTree({ feed, locale }: { feed: DivisionFeed; locale: Locale }) {
  const sv = locale === 'sv'
  const total = totalRounds(feed)
  const at = (round: number, slot: number) => feed.knockout.find(match => match.round === round && match.bracketSlot === slot && isVisible(match))
  const final = at(total, 0)
  const champion = final ? winner(final) : undefined
  const height = 2 ** (total - 1) * SLOT

  const card = (round: number, slot: number) => {
    const match = at(round, slot)
    // A missing first-round match is a bye: the seeded team goes straight through.
    const placeholder = round === 1 ? (sv ? 'Fri lott' : 'Bye') : (sv ? 'Väntar på vinnare' : 'Awaiting winner')
    return <BracketMatch match={match} placeholder={placeholder} locale={locale} />
  }

  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
      <div className="flex min-w-max">
        {Array.from({ length: total }, (_, index) => index + 1).map(round => {
          const slots = 2 ** (total - round)
          const first = feed.knockout.filter(match => match.round === round && match.startDateTime).sort((a, b) => a.startDateTime - b.startDateTime)[0]
          return (
            <div key={round} className={`w-52 shrink-0 ${round > 1 ? 'ml-8' : ''}`}>
              <div className="mb-3 h-10">
                <p className="text-xs font-black uppercase tracking-widest text-brand">{roundLabel(round, total, locale)}</p>
                {first && <p className="mt-0.5 text-xs text-muted-foreground">{matchTime(first.startDateTime, locale)}</p>}
              </div>
              <div className="flex flex-col" style={{ height }}>
                {round < total
                  ? Array.from({ length: slots / 2 }, (_, pair) => (
                    <div key={pair} className="relative flex flex-1 flex-col after:absolute after:-right-4 after:bottom-1/4 after:top-1/4 after:w-4 after:rounded-r-md after:border-y-2 after:border-r-2 after:border-border after:content-['']">
                      {[pair * 2, pair * 2 + 1].map(slot => (
                        <div key={slot} className={`relative flex flex-1 items-center ${round > 1 ? "before:absolute before:-left-4 before:top-1/2 before:w-4 before:border-t-2 before:border-border before:content-['']" : ''}`}>
                          {card(round, slot)}
                        </div>
                      ))}
                    </div>
                  ))
                  : <div className={`relative flex flex-1 items-center ${total > 1 ? "before:absolute before:-left-4 before:top-1/2 before:w-4 before:border-t-2 before:border-border before:content-['']" : ''} after:absolute after:-right-8 after:top-1/2 after:w-8 after:border-t-2 after:border-border after:content-['']`}>
                    {card(round, 0)}
                  </div>}
              </div>
            </div>
          )
        })}
        <div className="ml-8 w-40 shrink-0">
          <div className="mb-3 h-10"><p className="text-xs font-black uppercase tracking-widest text-brand">{sv ? 'Mästare' : 'Champion'}</p></div>
          <div className="flex items-center" style={{ height }}>
            <div className={`w-full rounded-2xl p-4 text-center ${champion ? 'bg-ink text-white' : 'border-2 border-dashed border-border text-muted-foreground'}`}>
              <Trophy size={26} className={`mx-auto ${champion ? 'text-accent' : ''}`} aria-hidden="true" />
              <p className={`mt-2 text-sm ${champion ? 'font-black' : 'font-semibold'}`}>{champion?.name ?? (sv ? 'Avgörs i finalen' : 'Decided in the final')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BracketMatch({ match, placeholder, locale }: { match?: MatchSummary; placeholder: string; locale: Locale }) {
  if (!match) return (
    <div className="flex h-[68px] w-full items-center justify-center rounded-xl border border-dashed border-border bg-white/60 px-3 text-xs font-semibold text-muted-foreground">{placeholder}</div>
  )
  const side = winnerSide(match)
  const scored = hasScore(match)
  const walkover = decisionLabel(match, locale)
  const row = (name: string | undefined, goals: number | null | undefined, penalties: number | null | undefined, won: boolean, lost: boolean, top: boolean) => (
    <div className={`flex h-[33px] items-center justify-between gap-2 px-3 text-sm ${top ? 'border-b border-border' : ''} ${won ? 'bg-brand-tint' : ''}`}>
      <span className={`min-w-0 truncate ${won ? 'font-black text-ink' : lost ? 'text-muted-foreground line-through decoration-muted-foreground/40' : 'font-semibold text-ink'}`}>
        {name || <span className="italic text-muted-foreground">{locale === 'sv' ? 'Ej klar' : 'TBD'}</span>}
      </span>
      {scored && <span className={`shrink-0 tabular-nums ${won ? 'font-black text-brand' : 'text-ink/60'}`}>
        {walkover && goals == null ? (won ? walkover : '') : goals ?? ''}{penalties != null && <span className="ml-0.5 text-[11px]">({penalties})</span>}
      </span>}
    </div>
  )
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-[0_2px_8px_rgba(12,46,53,.06)]" title={match.venueName ?? undefined}>
      {row(match.homeTeam?.name, match.homeGoals, match.homePenalties, side === 'home', side === 'away', true)}
      {row(match.awayTeam?.name, match.awayGoals, match.awayPenalties, side === 'away', side === 'home', false)}
    </div>
  )
}
