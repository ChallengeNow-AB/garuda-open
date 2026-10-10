'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ArrowRight, Feather, Menu, X } from 'lucide-react'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { Storefront } from '@/lib/types'
import { LanguageSwitcher } from './language-switcher'
import { CUP_NAME, STOREFRONT_NAME, STOREFRONT_SLUG } from '@/lib/brand'

/** Follows ?view= on client-side navigations (query changes fire no popstate). Suspended while prerendering. */
function ViewWatcher({ onChange }: { onChange: (view: string) => void }) {
  const view = useSearchParams().get('view') || ''
  useEffect(() => { onChange(view) }, [view, onChange])
  return null
}

export function SiteHeader({
  locale,
  dict,
  organization,
  cupTitle = CUP_NAME,
  registrationOpen = true,
}: {
  locale: Locale
  dict: Dictionary
  organization?: Storefront['organization']
  cupTitle?: string
  registrationOpen?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [hash, setHash] = useState('')
  const [view, setView] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  useEffect(() => {
    const update = () => {
      setHash(window.location.hash)
      setView(new URLSearchParams(window.location.search).get('view') || '')
    }
    update()
    window.addEventListener('hashchange', update)
    window.addEventListener('popstate', update)
    return () => {
      window.removeEventListener('hashchange', update)
      window.removeEventListener('popstate', update)
    }
  }, [pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  // Close the mobile menu with Escape, like any other popover.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const sv = locale === 'sv'
  const home = `/${locale}/${STOREFRONT_SLUG}`
  const registerHref = `${home}#registration`
  const links = [
    { href: home, label: sv ? 'Översikt' : 'Overview', active: !view && hash !== '#registration' },
    { href: registerHref, label: sv ? 'Anmälan' : 'Register', active: !view && hash === '#registration' },
    { href: `${home}?view=matches`, label: sv ? 'Matcher' : 'Matches', active: view === 'matches' },
    { href: `${home}?view=results`, label: sv ? 'Resultat' : 'Results', active: view === 'results' },
    { href: `${home}?view=bracket`, label: sv ? 'Slutspel' : 'Bracket', active: view === 'bracket' },
  ]
  const go = (href: string) => {
    setOpen(false)
    setView(new URLSearchParams(href.split('?')[1]?.split('#')[0] ?? '').get('view') ?? '')
    setHash(href.includes('#registration') ? '#registration' : '')
  }
  // The API's organization name is the bare slug ("satuminton"); the club's display name lives in brand.
  const organizer = STOREFRONT_NAME

  return (
    <header className={`sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl transition-shadow ${scrolled || open ? 'border-border shadow-[0_6px_24px_rgba(12,46,53,.07)]' : 'border-transparent'}`}>
      <Suspense fallback={null}><ViewWatcher onChange={setView} /></Suspense>
      <div className="page-container flex h-[72px] items-center justify-between gap-3 sm:gap-4">
        <Link href={home} className="group flex min-w-0 items-center gap-2.5 sm:gap-3" onClick={() => go(home)}>
          {organization?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={organization.logoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full border border-border bg-white object-contain p-1" />
          ) : (
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-accent sm:h-11 sm:w-11 transition group-hover:bg-brand">
              <Feather size={21} strokeWidth={2.2} />
            </span>
          )}
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-[15px] font-black uppercase tracking-tight text-ink sm:text-lg">{cupTitle}</span>
            <span className="mt-1 hidden truncate text-[10px] font-bold uppercase tracking-[.15em] text-brand sm:block">{organizer}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-muted p-1 lg:flex" aria-label={dict.nav.mainMenu}>
          {links.map(link => (
            <Link key={link.href} href={link.href} aria-current={link.active ? 'page' : undefined} onClick={() => go(link.href)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${link.active ? 'bg-white text-brand shadow-sm' : 'text-ink/70 hover:bg-white/60 hover:text-ink'}`}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher locale={locale} />
          {registrationOpen && <Link href={registerHref} onClick={() => go(registerHref)}
            className="hidden min-h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-black text-ink transition hover:bg-[#cde759] sm:inline-flex">
            {sv ? 'Anmäl dig' : 'Register'}<ArrowRight size={16} aria-hidden="true" />
          </Link>}
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-ink transition hover:bg-muted lg:hidden" aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(value => !value)}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" className="border-t border-border bg-white pb-5 pt-3 lg:hidden" aria-label={dict.nav.mainMenu}>
          <div className="page-container grid gap-1">
            {links.map(link => (
              <Link key={link.href} href={link.href} aria-current={link.active ? 'page' : undefined} onClick={() => go(link.href)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-bold transition ${link.active ? 'bg-brand-tint text-brand' : 'text-ink hover:bg-muted'}`}>
                {link.label}
                {link.active && <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />}
              </Link>
            ))}
            {registrationOpen && <Link href={registerHref} onClick={() => go(registerHref)}
              className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-base font-black text-ink transition hover:bg-[#cde759] sm:hidden">
              {sv ? 'Anmäl dig nu' : 'Register now'}<ArrowRight size={18} aria-hidden="true" />
            </Link>}
          </div>
        </nav>
      )}
    </header>
  )
}
