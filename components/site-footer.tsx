import Link from 'next/link'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { Storefront } from '@/lib/types'
import { CUP_NAME, STOREFRONT_SLUG } from '@/lib/brand'

export function SiteFooter({ locale, dict, cupTitle = CUP_NAME }: { locale: Locale; dict: Dictionary; organization?: Storefront['organization']; cupTitle?: string }) {
  return (
    <footer className="border-t border-border bg-white text-ink">
      <div className="page-container grid gap-5 py-7 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-8 sm:py-9">
        <div>
          <Link href={`/${locale}/${STOREFRONT_SLUG}`} className="inline-flex flex-col leading-none">
            <span className="text-lg font-black uppercase tracking-tight">{cupTitle}</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">{locale === 'sv' ? 'Arrangeras av' : 'Organized by'} Komunitas Badminton Stockholm</p>
        </div>
        <div className="text-sm text-muted-foreground sm:text-right">
          <p>{locale === 'sv' ? 'Drivs med' : 'Powered by'} <a href={`https://www.challengenow.se/${locale}`} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline-offset-4 hover:underline">ChallengeNow</a></p>
          <p className="mt-2 text-xs">© {new Date().getFullYear()} {cupTitle}. {dict.footer.rights}</p>
        </div>
      </div>
    </footer>
  )
}
