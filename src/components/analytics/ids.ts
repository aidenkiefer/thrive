// Google Tag Manager container for the new site. Source: owner decision 2026-11-18 (pasted
// the container GTM-PRJX6P9H). The audit docs (docs/01, docs/06) record GTM-NQV3Z3N7 on the
// live WordPress site; the owner chose the new container, so the audited ID is not loaded.
export const GTM_CONTAINER_ID = 'GTM-PRJX6P9H'

// Google Ads conversion ID. Source: docs/01-current-site-audit.md (Analytics row) and
// docs/06-integrations.md ("Google Ads"). Deliberately NOT loaded directly: the docs show
// no separate gtag.js loader, so it is assumed to be configured inside the GTM container.
// Loading it here as well could double-count conversions. Kept as a constant so the ID
// stays verified in one place if the owner later asks for a direct load.
export const GOOGLE_ADS_CONVERSION_ID = 'AW-16575196430'
