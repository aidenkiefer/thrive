import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { Analytics, AnalyticsNoScript } from '@/components/analytics/Analytics'
import { SiteShell } from '@/components/layout/SiteShell'
import { themeBootScript } from '@/lib/theme/preferences'
import './theme.css'
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
  metadataBase: new URL('https://thrivevineyard.com'),
  title: { default: 'Thrive Vineyard', template: '%s | Thrive Vineyard' },
  description: 'Thrive Vineyard Church — Spirit Filled. Down to Earth.',
  openGraph: { siteName: 'Thrive Vineyard', type: 'website', images: ['/og'] },
  twitter: { card: 'summary_large_image', images: ['/og'] },
}

export const viewport: Viewport = { themeColor: '#183d59' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The boot script sets the theme class and transition style before hydration.
    <html lang="en" data-scroll-behavior="smooth" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <AnalyticsNoScript />
        <Analytics />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
