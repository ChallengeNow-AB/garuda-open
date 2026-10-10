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
  targetGender?: string
  targetAudience?: string
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
  targetGender?: string
  targetAudience?: string
  skillLevel?: string
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
  /** How the organizer takes payment (Swish, bankgiro …). Absent on older API versions. */
  paymentMethods?: PaymentMethod[]
}

export interface PaymentMethod {
  providerName: string
  paymentReference: string
}

/** Mirrors the API's RegistrationReceiptVO, returned right after a registration. */
export interface RegistrationReceipt {
  kind: 'EVENT' | 'TOURNAMENT' | 'LEAGUE'
  activityId: number
  activityTitle: string
  cupTitle?: string | null
  teamName: string
  payment: {
    status: 'FREE' | 'UNPAID' | 'PAID' | 'PENDING'
    amount: number
    vatAmount: number
    currency?: string | null
    invoiceNumber?: string | null
    ocr?: string | null
    /** ISO date-time. */
    dueDate?: string | null
    sellerName?: string | null
    methods: PaymentMethod[]
  }
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
  /** MatchResult.MatchDecision, e.g. HOME_TEAM_WON or AWAY_TEAM_NO_SHOW. */
  decision?: string | null
}

/** One group of a tournament's group stage: a real league with its table and fixtures. */
export interface GroupSummary {
  id: number
  name?: string
  advanceCount: number
  standings: StandingSummary[]
  matches: MatchSummary[]
}

export interface BracketSummary {
  totalRounds: number
  status?: string
}

/** Everything the matches/results/bracket views need for one cup division. */
export interface DivisionFeed {
  division: CupDivision
  /** Knockout fixtures (round ≥ 1, bracketSlot within the round). */
  knockout: MatchSummary[]
  groups: GroupSummary[]
  bracket?: BracketSummary | null
  unavailable: boolean
}

export interface StorefrontDetail {
  organization: Storefront['organization']
  kind: 'LEAGUE' | 'TOURNAMENT' | 'EVENT'
  league?: League
  activity?: Activity
  participants: TeamSummary[]
  standings: StandingSummary[]
  matches: MatchSummary[]
  /** Tournament group stage (absent on older API versions). */
  groups?: GroupSummary[]
  bracket?: BracketSummary | null
}
