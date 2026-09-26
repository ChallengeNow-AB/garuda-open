import { NextResponse, type NextRequest } from 'next/server'
import { defaultLocale, isLocale, locales } from './lib/i18n'

/**
 * Ensures every path is locale-prefixed (/sv, /en). Subdomain → club rewrites
 * (satuminton.challengenow.se → /:locale/satuminton) belong here later, once wildcard DNS
 * + TLS are in place; for now clubs are reachable at /:locale/:slug.
 */
function preferredLocale(request: NextRequest): string {
  const cookie = request.cookies.get('NEXT_LOCALE')?.value
  if (cookie && isLocale(cookie)) return cookie
  const header = request.headers.get('accept-language')?.toLowerCase() ?? ''
  if (header.includes('en')) return 'en'
  return defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const localeRoot = locales.find(locale => pathname === `/${locale}`)
  if (localeRoot) {
    const url = request.nextUrl.clone()
    url.pathname = `/${localeRoot}/satuminton`
    return NextResponse.redirect(url)
  }

  const hasLocale = locales.some(locale => pathname.startsWith(`/${locale}/`))
  if (hasLocale) return NextResponse.next()

  const locale = preferredLocale(request)
  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' ? `/${locale}/satuminton` : `/${locale}${pathname}`
  const res = NextResponse.redirect(url)
  res.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' })
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
