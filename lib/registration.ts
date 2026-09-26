export type RegistrationTarget = 'league' | 'event' | 'tournament'

export function playerRegistrationUrl(destination?: string): string {
  const playerApp = process.env.NEXT_PUBLIC_PLAYER_APP_URL ?? 'https://app.challengenow.se'
  const suffix = destination ? `?from=${encodeURIComponent(destination)}` : ''
  return `${playerApp}/register${suffix}`
}

export function registrationUrl(type: RegistrationTarget, id: number): string {
  const playerApp = process.env.NEXT_PUBLIC_PLAYER_APP_URL ?? 'https://app.challengenow.se'
  const path = type === 'league' ? 'league' : 'event'
  return `${playerApp}/${path}/${id}`
}
