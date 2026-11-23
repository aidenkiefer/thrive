import { createHash } from 'node:crypto'
import { readdir, readFile, mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const extensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg', '.tif', '.tiff'])
const excluded = new Set(['node_modules', 'work', 'outputs', 'dist', 'build', 'coverage', 'test-results', 'playwright-report'])

export async function findImages(root, relative = '') {
  const entries = await readdir(path.join(root, relative), { withFileTypes: true })
  const found = []
  for (const entry of entries) {
    if (entry.name.startsWith('.') || excluded.has(entry.name) || entry.isSymbolicLink()) continue
    const name = path.posix.join(relative, entry.name)
    if (entry.isDirectory()) found.push(...await findImages(root, name))
    else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) found.push(name)
  }
  return found.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
}

function collection(source) {
  if (source.startsWith('media-library/church-photos/')) return 'Church photo originals'
  if (source.startsWith('media-library/wordpress-assets/')) return 'Artwork originals'
  if (source.startsWith('public/images/church/')) return 'Website photos'
  if (source.startsWith('public/images/brand/')) return 'Brand assets'
  if (source.startsWith('public/images/flames/')) return 'Flames artwork'
  return 'Other repository images'
}

export async function buildMediaLibrary(root) {
  const output = path.join(root, '.media-previews')
  await mkdir(output, { recursive: true })
  const sources = await findImages(root)
  const assets = []
  // Bounded concurrency keeps full-resolution source decoding inexpensive in CI.
  for (let start = 0; start < sources.length; start += 3) {
    const batch = await Promise.all(sources.slice(start, start + 3).map(async sourcePath => {
      const source = await readFile(path.join(root, sourcePath))
      const id = createHash('sha256').update(sourcePath).update(source).digest('hex').slice(0, 24)
      const metadata = await sharp(source).metadata()
      const dimensions = metadata.autoOrient ?? metadata
      if (!dimensions.width || !dimensions.height) throw new Error(`Missing image dimensions: ${sourcePath}`)
      const thumbnail = path.join(output, `${id}-thumbnail.webp`)
      const preview = path.join(output, `${id}-preview.webp`)
      const exists = await Promise.all([access(thumbnail), access(preview)]).then(() => true, () => false)
      if (!exists) {
        await sharp(source).rotate().resize({ width: 600, height: 450, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 76 }).toFile(thumbnail)
        await sharp(source).rotate().resize({ width: 2200, height: 1800, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 86 }).toFile(preview)
      }
      return { id, filename: path.basename(sourcePath), sourcePath, collection: collection(sourcePath),
        thumbnailUrl: `/admin/media/image/${id}?size=thumbnail`, previewUrl: `/admin/media/image/${id}?size=preview`,
        width: dimensions.width, height: dimensions.height }
    }))
    assets.push(...batch)
  }
  if (new Set(assets.map(asset => asset.id)).size !== assets.length) throw new Error('Duplicate media IDs')
  await writeFile(path.join(output, 'catalog.json'), JSON.stringify(assets, null, 2) + '\n')
  return assets
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const assets = await buildMediaLibrary(process.cwd())
  console.log(`Media library: generated private previews for ${assets.length} repository images.`)
}
