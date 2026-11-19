/**
 * Church facts reused across the public site.
 *
 * Every value is copied from the live-site audit (docs/audit/2026-11/pages/*.md,
 * captured 2026-11-07) or from existing code that already carried it. Do not add
 * facts here without an audit or owner source.
 */
export const SITE = {
  name: 'Thrive Vineyard Church',
  shortName: 'Thrive Vineyard',
  tagline: 'Spirit Filled. Down to Earth.',
  // Source: audit about.md / get-connected.md ("Location 845 E Glencoe St Palatine, IL 60074")
  address: {
    street: '845 E Glencoe St',
    city: 'Palatine',
    region: 'IL',
    postalCode: '60074',
  },
  addressLine: '845 E Glencoe St, Palatine, IL 60074',
  mapsUrl: 'https://maps.app.goo.gl/XyPTAnSmpk72uxZ96',
  // Source: audit plan-a-visit.md (Google Maps iframe in the live /im-new/ page)
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5919.938296977882!2d-88.02458348728797!3d42.10813155085893!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880fa4dae55d57f7%3A0x83587fa0916b03d3!2sThrive%20Vineyard%20Church!5e0!3m2!1sen!2sus!4v1714944234699!5m2!1sen!2sus',
  // Source: audit about.md / get-connected.md ("Email Us", "Call Us")
  email: 'info@thrivevineyard.com',
  phone: '(847) 668-5622',
  phoneHref: 'tel:+18476685622',
  social: {
    youtube: 'https://www.youtube.com/@thrivevineyardchurchus',
    facebook: 'https://www.facebook.com/thrivevineyardchurch',
    instagram: 'https://www.instagram.com/thrivevineyard/',
  },
  // Source: audit get-connected.md (Mailchimp classic embed on the live page)
  newsletterAction:
    'https://thrivevineyard.us14.list-manage.com/subscribe/post?u=52ddf886e427ded72ba838cce&id=2f89d575c4&f_id=00ebb6e5f0',
  // Source: audit give.md
  giveOnlineUrl: 'https://thrivevineyard.churchsuite.com/donate/',
} as const
