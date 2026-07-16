import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { SiteShell } from '@/components/layout/SiteShell'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Thrive Vineyard', template: '%s | Thrive Vineyard' },
  description: 'Thrive Vineyard Church — Spirit Filled. Down to Earth.',
  openGraph: { siteName: 'Thrive Vineyard', type: 'website' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body><SiteShell>{children}</SiteShell></body>
    </html>
  )
}
