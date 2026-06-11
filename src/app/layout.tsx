import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Thrive Vineyard',
    template: '%s | Thrive Vineyard',
  },
  description: 'Thrive Vineyard Church',
  openGraph: {
    siteName: 'Thrive Vineyard',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* TODO: GlobalNav component */}
        <main>{children}</main>
        {/* TODO: Footer component */}
      </body>
    </html>
  )
}
