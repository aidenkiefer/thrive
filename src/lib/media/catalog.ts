import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { MediaAsset } from './types'

const ID = /^[a-f0-9]{24}$/
let catalog: Promise<MediaAsset[]> | undefined

export function getMediaAssets(): Promise<MediaAsset[]> {
  catalog ??= readFile(path.join(process.cwd(), '.media-previews/catalog.json'), 'utf8')
    .then(source => JSON.parse(source) as MediaAsset[])
    .catch(error => { catalog = undefined; throw error })
  return catalog
}

/** The request selects a known catalog ID, never a filesystem path. */
export async function readMediaPreview(id: string, variant: 'thumbnail' | 'preview'): Promise<ArrayBuffer | null> {
  if (!ID.test(id)) return null
  const assets = await getMediaAssets()
  if (!assets.some(asset => asset.id === id)) return null
  try {
    return new Uint8Array(await readFile(path.join(process.cwd(), '.media-previews', `${id}-${variant}.webp`))).buffer
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}
