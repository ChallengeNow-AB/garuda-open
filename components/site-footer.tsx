import Link from 'next/link'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { Storefront } from '@/lib/types'
import { CUP_NAME, STOREFRONT_SLUG } from '@/lib/brand'

export function SiteFooter({ locale, dict, organization, cupTitle = CUP_NAME }: { locale: Locale; dict: Dictionary; organization?: Storefront['organization']; cupTitle?: string }) {
  return (
    <footer className="bg-ink text-white">
      <div className="page-container grid gap-10 py-12 lg:grid-cols-[1fr_auto]">
        <div>
          <Link href={`/${locale}/${STOREFRONT_SLUG}`} className="inline-flex flex-col leading-none">
            <span className="text-2xl font-black uppercase tracking-tight">{cupTitle}</span>
          </Link>
          {organization?.name && <p className="mt-3 text-sm text-white/60">{locale === 'sv' ? 'Arrangör' : 'Organized by'}: {organization.name}</p>}
        </div>
        <div className="text-sm text-white/50 lg:text-right">
          <p>{dict.footer.systemBy}</p>
          <p className="mt-2">© {new Date().getFullYear()} {cupTitle}. {dict.footer.rights}</p>
        </div>
      </div>
    </footer>
  )
}
