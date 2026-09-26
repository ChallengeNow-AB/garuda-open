export interface Address {
  street?: string
  city?: string
  postCode?: string
}

export interface Club {
  id: number
  slug: string
  name: string
  logoUrl?: string
  city?: string
  type?: string
}

export interface Branding {
  primaryColor: string
  accentColor: string
  coverImageUrl?: string
  tagline?: string
  about?: string
}

export interface League {
  id: number
  name: string
  description?: string
  imageUrl?: string
  category?: string
  locality?: string
  currency?: string
  fee: number
  matchFee: number
  capacity: number
  startDate?: number
  endDate?: number
  seasonStarted: boolean
  joinWhileStarted: boolean
}

export interface Activity {
  id: number
  title: string
  description?: string
  imageUrl?: string
  type?: string
  category?: string
  venueName?: string
  address?: Address
  currency?: string
  price?: number
  capacity?: number
  joined?: number
  registrationClosed: boolean
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
  cupId?: number
}

export interface CupDivision {
  id: number
  title: string
  targetGender?: string
  targetAudience?: string
  skillLevel?: string
  price?: number
  capacity?: number
  joined: number
  registrationClosed: boolean
}

export interface Cup {
  id: number
  title: string
  description?: string
  imageUrl?: string
  category?: string
  startDate: string
  endDate?: string
  registrationDeadline?: string
  currency?: string
  price?: number
  capacity?: number
  divisions: CupDivision[]
}

export interface Storefront {
  organization: {
    id: number
    slug: string
    name: string
    logoUrl?: string
    organizationType?: string
    address?: Address
  }
  branding: Branding
  leagues: League[]
  tournaments: Activity[]
  cups?: Cup[]
  events: Activity[]
}

export interface TeamSummary {
  id: number
  name: string
  logoUrl?: string
  organizationName?: string
}

export interface StandingSummary {
  position: number
  teamId: number
  teamName: string
  teamLogoUrl?: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface MatchSummary {
  id: number
  homeTeam: TeamSummary
  awayTeam?: TeamSummary
  venueName?: string
  startDateTime: number
  status?: string
  homeGoals?: number
  awayGoals?: number
  homePenalties?: number
  awayPenalties?: number
  verifiedResult: boolean
  round: number
  bracketSlot: number
}

export interface StorefrontDetail {
  organization: Storefront['organization']
  kind: 'LEAGUE' | 'TOURNAMENT' | 'EVENT'
  league?: League
  activity?: Activity
  participants: TeamSummary[]
  standings: StandingSummary[]
  matches: MatchSummary[]
}
