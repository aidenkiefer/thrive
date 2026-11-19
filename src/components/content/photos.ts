/**
 * Church photography already published on the live WordPress site.
 *
 * Source: docs/audit/2026-11/pages/*.md image tables (captured 2026-11-07).
 * Alt text describes what each photo shows (verified by viewing the files).
 * The four kids* photos are stock images the live Kids page already uses; portrait-to-person
 * mapping for staff photos follows the audit's image order and file names.
 *
 * TEMPORARY: these load from thrivevineyard.com via the `remotePatterns` entry in
 * next.config.ts. Re-host in Supabase Storage (or /public) before the WordPress
 * site is retired, then remove that pattern.
 */
const BASE = 'https://thrivevineyard.com/wp-content/uploads'

export interface Photo {
  src: string
  alt: string
  width: number
  height: number
}

export const PHOTOS = {
  worship: {
    src: `${BASE}/2024/04/Nathan-Worship.jpg`,
    alt: 'A worship leader plays guitar on stage while congregation members raise their hands.',
    width: 1920,
    height: 1280,
  },
  prayer: {
    src: `${BASE}/2024/04/Carolyn.jpg`,
    alt: 'Two women pray with their eyes closed during a Sunday service.',
    width: 1920,
    height: 1280,
  },
  pastors: {
    src: `${BASE}/2024/04/Molly-and-Kevin-Pulpit-1-scaled-e1714259072637.jpg`,
    alt: 'Pastors Kevin and Molly Kiefer standing together at the pulpit.',
    width: 1706,
    height: 1706,
  },
  familyWorship: {
    src: `${BASE}/2024/04/Adrienne-and-Judah.jpg`,
    alt: 'A woman worships with one hand raised while holding her young son.',
    width: 600,
    height: 800,
  },
  water: {
    src: `${BASE}/2024/08/lakesquare.jpg`,
    alt: 'Sunlit water rippling over rocks in a stream.',
    width: 1080,
    height: 1080,
  },
  kevin: {
    src: `${BASE}/2024/04/kevin-wall.jpg`,
    alt: 'Portrait of Kevin Kiefer.',
    width: 800,
    height: 800,
  },
  molly: {
    src: `${BASE}/2024/04/Mollywall-scaled-e1714258419441.jpeg`,
    alt: 'Portrait of Molly Kiefer.',
    width: 800,
    height: 800,
  },
  jjay: {
    src: `${BASE}/2024/04/Jjay-wall-e1714855730602.jpg`,
    alt: 'Portrait of Jjay Neumaier.',
    width: 541,
    height: 541,
  },
  carley: {
    src: `${BASE}/2024/04/Carley-Wall.jpg`,
    alt: 'Portrait of Carley LaPointe.',
    width: 800,
    height: 800,
  },
  mikeAndTami: {
    src: `${BASE}/2024/04/Mike-and-Tami.jpg`,
    alt: 'Mike and Tami.',
    width: 800,
    height: 800,
  },
  royAndJulie: {
    src: `${BASE}/2024/04/Roy-and-Julie.jpg`,
    alt: 'Roy and Julie.',
    width: 800,
    height: 800,
  },
  michiAndNathan: {
    src: `${BASE}/2024/04/Michi-and-Nathan.jpg`,
    alt: 'Michi and Nathan.',
    width: 800,
    height: 800,
  },
  jjayAndJustin: {
    src: `${BASE}/2024/04/JJay-and-Justin.jpg`,
    alt: 'Jjay and Justin.',
    width: 800,
    height: 800,
  },
  mary: {
    src: `${BASE}/2024/05/Mary-e1714853998990.jpeg`,
    alt: 'Portrait of Mary Sirois.',
    width: 768,
    height: 769,
  },
  kidsNewborns: {
    src: `${BASE}/2022/12/kids-newborns_600x400-1.jpg`,
    alt: 'A smiling dad holds his baby in warm afternoon light.',
    width: 600,
    height: 400,
  },
  kidsPreschool: {
    src: `${BASE}/2022/12/kids-preschool_600x400-1.jpg`,
    alt: 'A toddler in a high chair holds a toy camera up to her eye.',
    width: 600,
    height: 400,
  },
  kidsReading: {
    src: `${BASE}/2022/12/kids-reading-preschool_600x400-1.jpg`,
    alt: 'A young boy sits on the floor reading a picture book among shelves of books.',
    width: 600,
    height: 400,
  },
  kidsSchoolAge: {
    src: `${BASE}/2022/12/boy-facial-expression-girl-2150606-1.jpg`,
    alt: 'Two teenagers sit together outdoors, smiling.',
    width: 600,
    height: 399,
  },
} as const satisfies Record<string, Photo>

export type PhotoKey = keyof typeof PHOTOS
