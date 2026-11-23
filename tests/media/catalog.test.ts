import { mkdtemp, mkdir, readFile, rm, symlink } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import sharp from 'sharp'

// Build tooling is JavaScript so it also runs before Next's TypeScript build.
import { buildMediaLibrary, findImages } from '../../scripts/build-media-library.mjs'

const roots: string[] = []
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))) })
async function fixture() { const root = await mkdtemp(path.join(os.tmpdir(), 'thrive-media-test-')); roots.push(root); return root }

describe('repository media catalog', () => {
  it('covers images outside public while excluding dependencies, generated output and symlinks', async () => {
    const root = await fixture()
    for (const dir of ['public/images', 'media-library/church-photos', 'node_modules/pkg', '.media-previews']) await mkdir(path.join(root, dir), { recursive: true })
    for (const name of ['public/images/small.png', 'media-library/church-photos/original.jpeg', 'node_modules/pkg/ignore.png', '.media-previews/ignore.webp']) {
      await sharp({ create: { width: 10, height: 6, channels: 3, background: '#183d59' } }).toFile(path.join(root, name))
    }
    await symlink(path.join(root, 'public/images/small.png'), path.join(root, 'public/images/link.png'))
    expect(await findImages(root)).toEqual(['media-library/church-photos/original.jpeg', 'public/images/small.png'])
    const assets = await buildMediaLibrary(root)
    expect(assets).toHaveLength(2)
    for (const asset of assets) {
      expect(asset.id).toMatch(/^[a-f0-9]{24}$/)
      expect(await sharp(await readFile(path.join(root, '.media-previews', `${asset.id}-thumbnail.webp`))).metadata()).toMatchObject({ format: 'webp', width: 10, height: 6 })
    }
  })
  it('invalidates image URLs when the source changes and keeps stable IDs otherwise', async () => {
    const root = await fixture(); const input = path.join(root, 'image.png')
    await sharp({ create: { width: 8, height: 8, channels: 3, background: '#183d59' } }).png().toFile(input)
    const first = await buildMediaLibrary(root)
    expect((await buildMediaLibrary(root))[0].id).toBe(first[0].id)
    await sharp({ create: { width: 8, height: 8, channels: 3, background: '#c9828a' } }).png().toFile(input)
    expect((await buildMediaLibrary(root))[0].id).not.toBe(first[0].id)
  })
})
