import Link from 'next/link'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { Storefront } from '@/lib/types'
import { STOREFRONT_NAME, STOREFRONT_SLUG } from '@/lib/brand'

export function SiteFooter({ locale, dict, organization }: { locale: Locale; dict: Dictionary; organization?: Storefront['organization'] }) {
  return (
    <footer className="bg-ink text-white">
      <div className="page-container grid gap-10 py-12 lg:grid-cols-[1fr_auto]">
        <div>
          <Link href={`/${locale}/${STOREFRONT_SLUG}`} className="inline-flex flex-col leading-none">
            <span className="text-2xl font-black uppercase tracking-[-.06em]">KOMU<span className="text-accent">NITAS</span></span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[.18em] text-white/65">Badminton Stockholm</span>
          </Link>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">{dict.footer.tagline}</p>
          {organization?.address?.city && <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/40">{organization.address.city}</p>}
        </div>
        <div className="text-sm text-white/50 lg:text-right">
          <p>{dict.footer.systemBy}</p>
          <p className="mt-2">© {new Date().getFullYear()} {organization?.name ?? STOREFRONT_NAME}. {dict.footer.rights}</p>
        </div>
      </div>
    </footer>
  )
}
