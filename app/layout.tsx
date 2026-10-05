import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { CUP_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://garuda.challengenow.se'),
  title: { default: CUP_NAME, template: `%s — ${CUP_NAME}` },
  description: `Cupinformation och anmälan till ${CUP_NAME}.`,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="sv" suppressHydrationWarning><body>{children}</body></html>
}
