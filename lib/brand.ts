import type { Storefront } from './types'

export const STOREFRONT_SLUG = 'satuminton'
export const STOREFRONT_NAME = 'Komunitas Badminton Stockholm'
export const CUP_ID = 3
export const CUP_NAME = 'Garuda Open 2026'
export const CUP_BANNER = '/garuda-hero.png'

/** A truthful shell while the organization has not published its API storefront. */
export const unpublishedStorefront: Storefront = {
  organization: {
    id: 0,
    slug: STOREFRONT_SLUG,
    name: STOREFRONT_NAME,
    address: { city: 'Stockholm' },
  },
  branding: {
    primaryColor: '#137f70',
    accentColor: '#dcf26b',
  },
  leagues: [],
  tournaments: [],
  cups: [],
  events: [],
}
