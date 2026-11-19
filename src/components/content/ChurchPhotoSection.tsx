import Image from 'next/image'
import { Band } from './Band'
import { CHURCH_PHOTOS } from './photos'
import { SectionIntro } from './SectionIntro'

/**
 * Owner-supplied church photos (LaSalle Studios set and baptism photos, 2026-11-19).
 * Shown on About so the full selected set is on the draft.
 */
export function ChurchPhotoSection() {
  return (
    <Band tone="light" prose={false}>
      <SectionIntro
        eyebrow="Life at Thrive"
        title="Sundays and the people who gather"
        lead="Photographs from Thrive gatherings, including baptism and kids ministry."
      />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CHURCH_PHOTOS.map((photo) => (
          <li key={photo.src} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-100">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </Band>
  )
}
