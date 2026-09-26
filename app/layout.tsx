import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { STOREFRONT_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3004'),
  title: { default: STOREFRONT_NAME, template: `%s — ${STOREFRONT_NAME}` },
  description: `Badminton, tävlingar, cuper och aktiviteter hos ${STOREFRONT_NAME}.`,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="sv" suppressHydrationWarning><body>{children}</body></html>
}
