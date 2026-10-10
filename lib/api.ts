import type { Club, Cup, CupMatch, Storefront, StorefrontDetail } from './types'
import { STOREFRONT_NAME, STOREFRONT_SLUG } from './brand'

const API_URL = (process.env.CN_API_URL ?? 'https://apiv2.challengenow.se').replace(/\/$/, '')

export type StorefrontApiResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'not-found' }
  | { status: 'error' }

async function cnGetResult<T>(path: string): Promise<StorefrontApiResult<T>> {
  const url = `${API_URL}${path}`
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    })
    if (response.status === 404) return { status: 'not-found' }
    if (!response.ok) {
      console.error(`[storefront-api] GET ${url} returned ${response.status}`)
      return { status: 'error' }
    }
    return { status: 'ok', data: (await response.json()) as T }
  } catch (error) {
    console.error(`[storefront-api] GET ${url} failed`, error)
    return { status: 'error' }
  }
}

export async function getStorefrontResult(slug: string): Promise<StorefrontApiResult<Storefront>> {
  const result = await cnGetResult<Storefront>(`/api/storefronts/${encodeURIComponent(slug)}`)
  if (result.status !== 'ok' || slug !== STOREFRONT_SLUG) return result
  return {
    status: 'ok',
    data: {
      ...result.data,
      organization: result.data.organization,
    },
  }
}

export async function getStorefront(slug: string): Promise<Storefront | null> {
  const result = await getStorefrontResult(slug)
  return result.status === 'ok' ? result.data : null
}

export type DetailKind = 'league' | 'tournament' | 'activity'

export function getStorefrontDetail(slug: string, kind: DetailKind, id: number): Promise<StorefrontDetail | null> {
  return getStorefrontDetailResult(slug, kind, id).then(result => result.status === 'ok' ? result.data : null)
}

export function getStorefrontDetailResult(slug: string, kind: DetailKind, id: number): Promise<StorefrontApiResult<StorefrontDetail>> {
  const resources: Record<DetailKind, string> = {
    league: 'leagues',
    tournament: 'tournaments',
    activity: 'events',
  }
  return cnGetResult<StorefrontDetail>(`/api/storefronts/${encodeURIComponent(slug)}/${resources[kind]}/${id}`)
}

export function getCupDetailResult(slug: string, id: number): Promise<StorefrontApiResult<Cup>> {
  return cnGetResult<Cup>(`/api/storefronts/${encodeURIComponent(slug)}/cups/${id}`)
}

/** A cup is a collection of tournament divisions. Match data lives on each division. */
export async function getCupMatchFeed(slug: string, cup: Cup): Promise<{ matches: CupMatch[]; unavailable: boolean }> {
  const details = await Promise.all(cup.divisions.map(async division => ({
    division,
    result: await getStorefrontDetailResult(slug, 'tournament', division.id),
  })))
  return {
    matches: details.flatMap(({ division, result }) => result.status === 'ok'
      ? result.data.matches.map(match => ({ ...match, divisionId: division.id, divisionTitle: division.title }))
      : []),
    unavailable: details.some(({ result }) => result.status === 'error'),
  }
}

export async function getClubs(): Promise<Club[]> {
  const slugs = (process.env.STOREFRONT_SLUGS ?? STOREFRONT_SLUG).split(',').map(value => value.trim()).filter(Boolean)
  const storefronts = await Promise.all(slugs.map(getStorefront))
  return storefronts.flatMap(storefront => storefront ? [{
    id: storefront.organization.id,
    slug: storefront.organization.slug,
    name: storefront.organization.name,
    logoUrl: storefront.organization.logoUrl,
    city: storefront.organization.address?.city,
    type: storefront.organization.organizationType,
  }] : [])
}
