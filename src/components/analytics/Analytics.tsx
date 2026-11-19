import Script from 'next/script'
import { GTM_CONTAINER_ID } from './ids'
import { isTrackingEnabled } from './tracking'

// Standard Google Tag Manager bootstrap (dataLayer init + gtm.js loader).
const GTM_BOOTSTRAP = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`

/** GTM loader. Renders nothing outside production. */
export function Analytics() {
  if (!isTrackingEnabled(process.env.VERCEL_ENV)) return null
  return (
    <Script id="gtm-bootstrap" strategy="afterInteractive">
      {GTM_BOOTSTRAP}
    </Script>
  )
}

/** GTM noscript fallback; must be the first child of <body>. Renders nothing outside production. */
export function AnalyticsNoScript() {
  if (!isTrackingEnabled(process.env.VERCEL_ENV)) return null
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  )
}
