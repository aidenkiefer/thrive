/**
 * Church photography.
 *
 * Local files in /images/church are the owner-supplied LaSalle Studios set and
 * baptism photos (selected 2026-11-19, published with the kids-ministry shots).
 * Alt text describes what is in the frame. Staff portraits and the four kids*
 * age-group photos are still the WordPress files from the 2026-11-07 audit,
 * because this set has no identified replacement for those frames.
 *
 * TEMPORARY: the WordPress URLs load via `remotePatterns` in next.config.ts.
 * Re-host those remaining files before the WordPress site is retired.
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
    src: '/images/church/lasalle-18.webp',
    alt: 'The congregation faces the platform during a Sunday gathering, with a wooden cross on the wall.',
    width: 1600,
    height: 1067,
  },
  prayer: {
    src: '/images/church/lasalle-38.webp',
    alt: 'A group of people pray together.',
    width: 1600,
    height: 1067,
  },
  kidsMinistry: {
    src: '/images/church/lasalle-23.webp',
    alt: 'Children gathered outside beside a sign that reads Kids Ministry, Preschool and Elementary Age.',
    width: 1600,
    height: 1067,
  },
  kidsMinistryGroup: {
    src: '/images/church/lasalle-24.webp',
    alt: 'A kids ministry group gathered beside the kids ministry sign.',
    width: 1600,
    height: 1067,
  },
  pastors: {
    src: `${BASE}/2024/04/Molly-and-Kevin-Pulpit-1-scaled-e1714259072637.jpg`,
    alt: 'Pastors Kevin and Molly Kiefer standing together at the pulpit.',
    width: 1706,
    height: 1706,
  },
  familyWorship: {
    src: `${BASE}/2024/04/Adrienne-and-Judah.jpg`,
    alt: 'A woman worships with one hand raised while holding a young child.',
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
    alt: 'A smiling adult holds a baby in warm afternoon light.',
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
    alt: 'Two young people sit together outdoors, smiling.',
    width: 600,
    height: 399,
  },
} as const satisfies Record<string, Photo>

export type PhotoKey = keyof typeof PHOTOS

/** Every selected church photo, in selection order, for the about-page gallery. */
export const CHURCH_PHOTOS: readonly Photo[] = [
  { src: '/images/church/img-2355.webp', alt: 'A close view of a baptism.', width: 1600, height: 1200 },
  { src: '/images/church/img-2356.webp', alt: 'A baptism outside the church building.', width: 1200, height: 1600 },
  { src: '/images/church/img-2357.webp', alt: 'A gathering around a baptism outside the church.', width: 1600, height: 1200 },
  { src: '/images/church/lasalle-01.webp', alt: 'A musician on stage.', width: 1067, height: 1600 },
  { src: '/images/church/lasalle-02.webp', alt: 'A singer on stage.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-05.webp', alt: 'A congregant during worship.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-06.webp', alt: 'A bass player.', width: 1067, height: 1600 },
  { src: '/images/church/lasalle-07.webp', alt: 'A singer with one hand raised.', width: 1067, height: 1600 },
  { src: '/images/church/lasalle-08.webp', alt: 'Raised hands during worship.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-09.webp', alt: 'A speaker holding a microphone.', width: 1067, height: 1600 },
  { src: '/images/church/lasalle-10.webp', alt: 'A close view of a guitar.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-11.webp', alt: 'Two people talking.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-12.webp', alt: 'A speaker at the lectern.', width: 1066, height: 1600 },
  { src: '/images/church/lasalle-14.webp', alt: 'A speaker and the congregation.', width: 1067, height: 1600 },
  { src: '/images/church/lasalle-15.webp', alt: 'A speaker beneath the cross.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-16.webp', alt: 'Hands holding an open Bible.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-17.webp', alt: 'Someone reading a Bible.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-18.webp', alt: 'The congregation faces the platform during a Sunday gathering, with a wooden cross on the wall.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-19.webp', alt: 'A speaker gesturing beneath the cross.', width: 1067, height: 1600 },
  { src: '/images/church/lasalle-20.webp', alt: 'A speaker beneath the cross.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-23.webp', alt: 'Children gathered outside beside a sign that reads Kids Ministry, Preschool and Elementary Age.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-24.webp', alt: 'A kids ministry group gathered beside the kids ministry sign.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-26.webp', alt: 'An open Bible and handwritten notes.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-28.webp', alt: 'A speaker beneath the cross.', width: 1067, height: 1600 },
  { src: '/images/church/lasalle-29.webp', alt: 'The Thrive church sign.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-30.webp', alt: 'A speaker gesturing.', width: 1067, height: 1600 },
  { src: '/images/church/lasalle-33.webp', alt: 'A speaker gesturing from the platform.', width: 1067, height: 1600 },
  { src: '/images/church/lasalle-34.webp', alt: 'A worshipper with open hands.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-36.webp', alt: 'A raised hand during worship.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-37.webp', alt: 'A speaker with a microphone.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-38.webp', alt: 'A group of people pray together.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-39.webp', alt: 'People praying together.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-40.webp', alt: 'A closer view of a group praying.', width: 1600, height: 1067 },
  { src: '/images/church/lasalle-41.webp', alt: 'Three people talking.', width: 1600, height: 1067 },
]
