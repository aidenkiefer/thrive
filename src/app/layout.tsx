import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { GlobalNav } from '@/components/layout/GlobalNav'
import { Footer } from '@/components/layout/Footer'
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
      <body>
        <GlobalNav />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
