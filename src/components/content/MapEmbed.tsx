import { SITE } from './site-info'
import { ArrowRightIcon, PinIcon } from './icons'

/** Audited Google Maps embed plus a plain directions link. */
export function MapEmbed({ className = '' }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-neutral-0 shadow-sm ring-1 ring-black/5 ${className}`}>
      <iframe
        title={`Map showing ${SITE.name} at ${SITE.addressLine}`}
        src={SITE.mapEmbedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-72 w-full border-0 md:h-96"
        allowFullScreen
      />
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="flex items-start gap-2 text-sm text-neutral-600">
          <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <span>
            <span className="block font-medium text-neutral-950">{SITE.name}</span>
            {SITE.addressLine}
          </span>
        </p>
        <a
          href={SITE.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-800 hover:text-brand-600"
        >
          Get directions
          <ArrowRightIcon className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
