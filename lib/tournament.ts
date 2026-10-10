import type { Locale } from './i18n'
import type { CupDivision, MatchSummary, TeamSummary } from './types'

/** Fixtures that were called off — never shown publicly. */
const DISCARDED = new Set(['CANCEL', 'REVOKED', 'DECLINED', 'OUTDATED'])

export function isVisible(match: MatchSummary): boolean {
  return !DISCARDED.has(match.status || '')
}

export function hasScore(match: MatchSummary): boolean {
  return (match.homeGoals != null && match.awayGoals != null) || Boolean(match.decision)
}

const HOME_WINS = new Set(['HOME_TEAM_WON', 'AWAY_TEAM_FORFEIT', 'AWAY_TEAM_NO_SHOW'])
const AWAY_WINS = new Set(['AWAY_TEAM_WON', 'HOME_TEAM_FORFEIT', 'HOME_TEAM_NO_SHOW'])

/**
 * Mirrors the API's resolveWinner: an explicit decision (walkover, no-show) wins, then the score,
 * then the shootout for a level knockout. Null while unplayed or genuinely drawn.
 */
export function winnerSide(match: MatchSummary): 'home' | 'away' | null {
  if (match.decision && HOME_WINS.has(match.decision)) return 'home'
  if (match.decision && AWAY_WINS.has(match.decision)) return 'away'
  if (match.homeGoals == null || match.awayGoals == null) return null
  if (match.homeGoals !== match.awayGoals) return match.homeGoals > match.awayGoals ? 'home' : 'away'
  if (match.homePenalties != null && match.awayPenalties != null && match.homePenalties !== match.awayPenalties) {
    return match.homePenalties > match.awayPenalties ? 'home' : 'away'
  }
  return null
}

export function winner(match: MatchSummary): TeamSummary | undefined {
  const side = winnerSide(match)
  return side === 'home' ? match.homeTeam : side === 'away' ? match.awayTeam : undefined
}

/** Walkover / no-show label for a decided-but-unplayed match. */
export function decisionLabel(match: MatchSummary, locale: Locale): string | null {
  if (!match.decision || !/(FORFEIT|NO_SHOW)$/.test(match.decision)) return null
  return locale === 'sv' ? 'W.O.' : 'Walkover'
}

/** "Final", "Semi-final", "Quarter-final", then "Round of 16" … counted back from the final. */
export function roundLabel(round: number, totalRounds: number, locale: Locale): string {
  const fromEnd = totalRounds - round
  const sv = locale === 'sv'
  if (fromEnd === 0) return sv ? 'Final' : 'Final'
  if (fromEnd === 1) return sv ? 'Semifinal' : 'Semi-final'
  if (fromEnd === 2) return sv ? 'Kvartsfinal' : 'Quarter-final'
  if (fromEnd === 3) return sv ? 'Åttondelsfinal' : 'Round of 16'
  if (totalRounds > 0 && fromEnd > 0 && !sv) return `Round of ${2 ** (fromEnd + 1)}`
  return sv ? `Omgång ${round}` : `Round ${round}`
}

export function matchTime(timestamp: number, locale: Locale): string | null {
  if (!timestamp || !Number.isFinite(timestamp)) return null
  return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', {
    timeZone: 'Europe/Stockholm', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(timestamp))
}

const CATEGORY: Record<string, { sv: string; en: string }> = {
  MALE: { sv: 'Herrdubbel', en: "Men's doubles" },
  FEMALE: { sv: 'Damdubbel', en: "Women's doubles" },
  MIXED: { sv: 'Mixeddubbel', en: 'Mixed doubles' },
}
const LEVEL: Record<string, { sv: string; en: string }> = {
  BEGINNER: { sv: 'Nybörjare', en: 'Beginner' },
  INTERMEDIATE: { sv: 'Medel', en: 'Intermediate' },
  ADVANCED: { sv: 'Avancerad', en: 'Advanced' },
  ELITE: { sv: 'Avancerad', en: 'Advanced' },
  PRO: { sv: 'Avancerad', en: 'Advanced' },
}

export function categoryLabel(gender: string | undefined, locale: Locale): string {
  return CATEGORY[gender ?? '']?.[locale] ?? (locale === 'sv' ? 'Övriga klasser' : 'Other divisions')
}

/** Short chip label inside a category row, e.g. "Medel · Fjäder" ("MD B feather"). */
export function divisionShortLabel(division: CupDivision, locale: Locale): string {
  const shuttle = division.title.match(/\b(nylon|feather)\b/i)?.[1]?.toLowerCase()
  const level = LEVEL[division.skillLevel ?? '']?.[locale]
  const parts = [level, shuttle === 'nylon' ? 'Nylon' : shuttle === 'feather' ? (locale === 'sv' ? 'Fjäder' : 'Feather') : undefined].filter(Boolean)
  return parts.length ? parts.join(' · ') : division.title
}

/** Full readable name, e.g. "Herrdubbel · Medel · Fjäder". */
export function divisionLabel(division: CupDivision, locale: Locale): string {
  return division.targetGender ? `${categoryLabel(division.targetGender, locale)} · ${divisionShortLabel(division, locale)}` : division.title
}
