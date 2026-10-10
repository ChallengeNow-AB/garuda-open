'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LOCALE_LABELS, locales, type Locale } from '@/lib/i18n'
import { Check, Globe } from 'lucide-react'

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function switchTo(next: Locale) {
    const rest = pathname.replace(/^\/[^/]+/, '')
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`
    router.push(`/${next}${rest}${window.location.search}${window.location.hash}`)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <Globe size={15} />
        {locale.toUpperCase()}
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-40 mt-1.5 w-40 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          {locales.map(l => (
            <button
              key={l}
              type="button"
              role="option"
              aria-selected={l === locale}
              onClick={() => switchTo(l)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium transition hover:bg-muted"
            >
              {LOCALE_LABELS[l]}
              {l === locale && <Check size={15} className="text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
