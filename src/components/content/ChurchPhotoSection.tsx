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
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-3 lg:grid-cols-4">
        {CHURCH_PHOTOS.map((photo) => (
          <li
            key={photo.src}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-100"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="origin-center object-cover transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.18] group-hover:duration-500 group-hover:ease-[cubic-bezier(0.22,1.45,0.36,1)] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </li>
        ))}
      </ul>
    </Band>
  )
}
