'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { Storefront } from '@/lib/types'
import { LanguageSwitcher } from './language-switcher'
import { CUP_NAME, STOREFRONT_SLUG } from '@/lib/brand'

export function SiteHeader({
  locale,
  dict,
  organization,
  cupTitle = CUP_NAME,
}: {
  locale: Locale
  dict: Dictionary
  organization?: Storefront['organization']
  cupTitle?: string
}) {
  const [open, setOpen] = useState(false)
  const home = `/${locale}/${STOREFRONT_SLUG}`
  const links = [
    { href: '#cup-information', label: locale === 'sv' ? 'Cupinformation' : 'Cup information', visible: true },
    { href: '#registration', label: dict.detail.register, visible: true },
  ].filter(link => link.visible)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-xl">
      <div className="page-container flex h-[76px] items-center justify-between gap-4">
        <Link href={home} className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          {organization?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={organization.logoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full border border-border bg-white object-contain p-1" />
          )}
          <span className="flex min-w-0 flex-col leading-none">
            <span className="text-base font-black uppercase tracking-tight text-ink sm:text-2xl">{cupTitle}</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label={dict.nav.mainMenu}>
          {links.map(link => <Link key={link.href} href={`${home}${link.href}`} className="text-sm font-bold text-ink/70 transition hover:text-brand">{link.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher locale={locale} />
          <Link href={`${home}#registration`} className="hidden items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand sm:inline-flex">{dict.detail.register}<ArrowUpRight size={16} /></Link>
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-ink lg:hidden" aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu} aria-expanded={open} onClick={() => setOpen(value => !value)}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border bg-white py-4 lg:hidden" aria-label={dict.nav.mainMenu}>
          <div className="page-container grid gap-1">
            {links.map(link => <Link key={link.href} href={`${home}${link.href}`} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-base font-bold text-ink transition hover:bg-brand-tint hover:text-brand">{link.label}</Link>)}
            <Link href={`${home}#registration`} onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-ink px-4 py-3 text-center text-sm font-bold text-white sm:hidden">{dict.detail.register}</Link>
          </div>
        </nav>
      )}
    </header>
  )
}
