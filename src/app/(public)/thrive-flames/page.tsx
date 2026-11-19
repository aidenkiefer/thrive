import type { Metadata } from 'next'
import Image from 'next/image'
import { PendingNote } from '@/components/content/PendingNote'
import { SITE } from '@/components/content/site-info'

/**
 * Source: the live page https://thrivevineyard.com/thrive-flames/ (read 2026-11-19)
 * and the supplied theme artwork in public/images/flames. Copy is the page text
 * and the scripture it prints. The Gravity Form is not recreated here.
 *
 * The theme lockups are navy type on a transparent field, so they sit on a light
 * background. A dark background hides the word.
 */
const themes = [
  {
    name: 'Ignite',
    image: '/images/flames/Ignite.webp',
    width: 1184,
    height: 445,
    accent: '#183d59',
    line: 'a vital, vibrant and intimate friendship with Jesus',
    scriptures: [
      '“God has given us eternal life, and this life is in his Son. Whoever has the Son has life; whoever does not have the Son of God does not have life” (1 John 5:11-12)',
      'Jesus said, “I have called you friends, for everything that I learned from my Father I have made known to you.” (John 15:15)',
    ],
  },
  {
    name: 'Activate',
    image: '/images/flames/Activate.webp',
    width: 1184,
    height: 445,
    accent: '#e0b322',
    line: 'the power, presence, and gifts of the Holy Spirit into our lives',
    scriptures: [
      '“But you will receive power when the Holy Spirit comes on you; and you will be my witnesses…” (Acts 1:8)',
      '“There are different kinds of gifts, but the same Spirit distributes them.” (1 Corinthians 12:4)',
    ],
  },
  {
    name: 'Grow',
    image: '/images/flames/Grow.webp',
    width: 1183,
    height: 445,
    accent: '#e07a2f',
    line: 'in Christlikeness and personal wholeness pursuing spiritual and emotional maturity',
    scriptures: [
      '“Above all else, guard your heart, for everything you do flows from it.” (Proverbs 4:23)',
      '“But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control; against such things there is no law.” (Galatians 5:22).',
    ],
  },
  {
    name: 'Engage',
    image: '/images/flames/Engage.webp',
    width: 1183,
    height: 445,
    accent: '#d64545',
    line: 'in God’s mission of rescuing the lost and caring for the poor',
    scriptures: [
      '“For the Son of Man came to seek and to save the lost.” (Luke 19:10)',
      '“Truly I tell you, whatever you did for one of the least of these brothers and sisters of mine, you did for me.” (Matthew 25:40)',
    ],
  },
  {
    name: 'Gather',
    image: '/images/flames/Gather.webp',
    width: 1184,
    height: 445,
    accent: '#8d8a84',
    line: 'in large and small groups to do life with one another',
    scriptures: [
      '“Let us consider how we may spur one another on toward love and good deeds, not giving up meeting together . . . but encouraging one another.” (Hebrews 10:24-25)',
      '“Let the message of Christ dwell among you richly as you teach and admonish one another with all wisdom through psalms, hymns, and songs from the Spirit, singing to God with gratitude in your hearts.” (Colossians 3:16)',
    ],
  },
] as const

export const metadata: Metadata = {
  title: 'Thrive Flames',
  description: 'Ignite, Activate, Grow, Engage, and Gather.',
}

export default function ThriveFlamesPage() {
  return (
    <>
      <section className="bg-neutral-100">
        <div className="mx-auto max-w-content px-4 pb-2 pt-6 sm:px-6 lg:px-8">
          <h1 className="sr-only">Thrive Flames</h1>
          <Image
            src="/images/flames/Flame-big.webp"
            alt="THRIVE! Ignite, Activate, Grow, Engage, and Gather."
            width={1920}
            height={1080}
            priority
            className="h-auto w-full"
          />
        </div>
      </section>
      {themes.map((theme) => (
        <section key={theme.name} className="bg-neutral-100">
          <div className="mx-auto max-w-content px-4 py-4 sm:px-6 lg:px-8">
            <article className="overflow-hidden rounded-3xl bg-neutral-0 shadow-sm ring-1 ring-black/5">
              <div className="h-1.5" style={{ backgroundColor: theme.accent }} />
              <div className="bg-neutral-100 px-4 py-6 sm:px-8">
                <Image
                  src={theme.image}
                  alt=""
                  width={theme.width}
                  height={theme.height}
                  className="mx-auto h-auto w-full max-w-3xl bg-neutral-100"
                />
              </div>
              <div className="px-6 py-8 sm:px-10 sm:py-10">
                <h2 className="sr-only">{theme.name}</h2>
                <p className="max-w-3xl font-display text-2xl font-semibold leading-snug text-neutral-950 md:text-3xl">
                  {theme.line}
                </p>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {theme.scriptures.map((verse) => (
                    <blockquote
                      key={verse}
                      className="rounded-2xl bg-neutral-100 px-5 py-5 text-base leading-relaxed text-neutral-600"
                      style={{ boxShadow: `inset 3px 0 0 ${theme.accent}` }}
                    >
                      {verse}
                    </blockquote>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>
      ))}
      <section className="bg-neutral-100">
        <div className="mx-auto max-w-prose px-4 py-10 sm:px-6 lg:px-8">
          <PendingNote title="Any Questions?">
            We are excited to hear from you. Let&rsquo;s find a time to chat! Email us at{' '}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </PendingNote>
        </div>
      </section>
    </>
  )
}
