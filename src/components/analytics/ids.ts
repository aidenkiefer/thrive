// Google Tag Manager container. Source: docs/01-current-site-audit.md (Analytics row)
// and docs/06-integrations.md ("Google Tag Manager", site-wide on the live site).
export const GTM_CONTAINER_ID = 'GTM-NQV3Z3N7'

// Google Ads conversion ID. Source: docs/01-current-site-audit.md (Analytics row) and
// docs/06-integrations.md ("Google Ads"). Deliberately NOT loaded directly: the docs show
// no separate gtag.js loader, so it is assumed to be configured inside the GTM container.
// Loading it here as well could double-count conversions. Kept as a constant so the ID
// stays verified in one place if the owner later asks for a direct load.
export const GOOGLE_ADS_CONVERSION_ID = 'AW-16575196430'
