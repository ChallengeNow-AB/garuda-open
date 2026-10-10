import Link from 'next/link'
import { Feather } from 'lucide-react'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { Storefront } from '@/lib/types'
import { CUP_NAME, STOREFRONT_NAME, STOREFRONT_SLUG } from '@/lib/brand'

export function SiteFooter({ locale, dict, cupTitle = CUP_NAME }: { locale: Locale; dict: Dictionary; organization?: Storefront['organization']; cupTitle?: string }) {
  const sv = locale === 'sv'
  const home = `/${locale}/${STOREFRONT_SLUG}`
  const links = [
    { href: home, label: sv ? 'Översikt' : 'Overview' },
    { href: `${home}#registration`, label: sv ? 'Anmälan' : 'Register' },
    { href: `${home}?view=matches`, label: sv ? 'Matcher' : 'Matches' },
    { href: `${home}?view=results`, label: sv ? 'Resultat' : 'Results' },
    { href: `${home}?view=bracket`, label: sv ? 'Slutspel' : 'Bracket' },
  ]
  return (
    <footer className="bg-ink text-white">
      <div className="page-container grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-12">
        <div>
          <Link href={home} className="inline-flex items-center gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-accent"><Feather size={19} strokeWidth={2.2} /></span>
            <span className="text-lg font-black uppercase tracking-tight">{cupTitle}</span>
          </Link>
          <p className="mt-3 text-sm text-white/65">{sv ? 'Arrangeras av' : 'Organized by'} {STOREFRONT_NAME}</p>
        </div>
        <nav aria-label={dict.nav.mainMenu} className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
          {links.map(link => <Link key={link.href} href={link.href} className="text-white/75 transition hover:text-accent">{link.label}</Link>)}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="page-container flex flex-col gap-2 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {cupTitle}. {dict.footer.rights}</p>
          <p>{sv ? 'Drivs med' : 'Powered by'} <a href={`https://www.challengenow.se/${locale}`} target="_blank" rel="noopener noreferrer" className="font-bold text-accent underline-offset-4 hover:underline">ChallengeNow</a></p>
        </div>
      </div>
    </footer>
  )
}
