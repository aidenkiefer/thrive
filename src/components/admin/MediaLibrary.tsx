'use client'

/* Private image requests need the staff cookie; do not send them through the public Next image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react'
import type { MediaAsset } from '@/lib/media/types'
import { AdminIcon } from './AdminIcon'

function FullImage({ asset }: { asset: MediaAsset }) {
  const [failed, setFailed] = useState(false)
  return failed ? <p role="status">This preview could not be loaded. Try another image or reopen the library.</p> : (
    <img src={asset.previewUrl} alt={asset.filename} width={asset.width} height={asset.height}
      draggable={false} onError={() => setFailed(true)} className="max-h-full max-w-full select-none object-contain" />
  )
}

export function MediaLibrary({ assets }: { assets: MediaAsset[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const open = selected !== null
  const active = selected === null ? null : assets[selected]

  useEffect(() => {
    if (!open) return
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    element?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element?.close()
      document.body.style.overflow = previousOverflow
      opener.current?.focus()
    }
  }, [open])

  const move = (direction: number) => setSelected(index => index === null ? null : (index + direction + assets.length) % assets.length)
  const control = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-brand-900/80 text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300'

  if (!assets.length) return <p className="rounded-2xl border border-neutral-200 bg-neutral-0 p-8 text-neutral-600">There are no images in the photo library yet.</p>

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
        {assets.map((asset, index) => (
          <button key={asset.id} type="button" onClick={event => { opener.current = event.currentTarget; setSelected(index) }}
            aria-label={`View ${asset.filename}, image ${index + 1} of ${assets.length}`}
            className="group min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0 text-left shadow-soft transition hover:border-brand-300 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
            <div className="aspect-[4/3] overflow-hidden bg-neutral-200">
              <img src={asset.thumbnailUrl} alt="" width={asset.width} height={asset.height}
                loading="lazy" decoding="async" className={`h-full w-full transition-transform motion-reduce:transition-none ${asset.collection.includes('photo') ? 'object-cover group-hover:scale-[1.03]' : 'object-contain p-4'}`} />
            </div>
            <div className="p-3 sm:p-4">
              <p className="truncate text-sm font-medium text-brand-900" title={asset.filename}>{asset.filename}</p>
              <p className="mt-1 text-xs text-neutral-600">{asset.collection}</p>
            </div>
          </button>
        ))}
      </div>

      <dialog ref={dialog} aria-labelledby="media-viewer-title" aria-describedby="media-viewer-position"
        onCancel={event => { event.preventDefault(); setSelected(null) }}
        onClose={() => setSelected(null)}
        onKeyDown={event => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) }
        }}
        className="m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-white backdrop:bg-brand-950/90 backdrop:backdrop-blur-sm">
        {active && (
          <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-3 p-3 sm:gap-5 sm:p-6" onClick={event => { if (event.target === event.currentTarget) setSelected(null) }}>
            <header className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="media-viewer-title" className="truncate font-medium !text-white">{active.filename}</h2>
                <p className="mt-1 text-sm text-white/75">{active.collection} · {active.width} × {active.height}</p>
              </div>
              <button type="button" autoFocus aria-label="Close image viewer" onClick={() => setSelected(null)} className={control}>
                <AdminIcon name="close" className="h-6 w-6" />
              </button>
            </header>
            <div className="flex min-h-0 items-center justify-center" style={{ touchAction: 'pan-y pinch-zoom' }}
              onPointerDown={event => {
                if (event.isPrimary && (event.pointerType === 'touch' || event.pointerType === 'pen')) {
                  pointer.current = { x: event.clientX, y: event.clientY }
                  event.currentTarget.setPointerCapture(event.pointerId)
                }
              }}
              onPointerCancel={() => { pointer.current = null }}
              onPointerUp={event => {
                const start = pointer.current; pointer.current = null
                if (!start) return
                const delta = event.clientX - start.x
                if (Math.abs(delta) > 48 && Math.abs(delta) > Math.abs(event.clientY - start.y) * 1.2) move(delta < 0 ? 1 : -1)
              }}>
              <FullImage key={active.id} asset={active} />
            </div>
            <footer className="flex items-center justify-center gap-6 pb-1">
              <button type="button" aria-label="Previous image" onClick={() => move(-1)} className={control}><AdminIcon name="arrow" className="h-5 w-5 rotate-180" /></button>
              <div className="text-center">
                <p id="media-viewer-position" aria-live="polite" className="text-sm tabular-nums">{selected! + 1} / {assets.length}</p>
                <p className="mt-1 text-xs text-white/65">Arrow keys or swipe to browse</p>
              </div>
              <button type="button" aria-label="Next image" onClick={() => move(1)} className={control}><AdminIcon name="arrow" className="h-5 w-5" /></button>
            </footer>
          </div>
        )}
      </dialog>
    </>
  )
}
