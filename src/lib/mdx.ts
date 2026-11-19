import fs from 'fs'
import path from 'path'

/**
 * Read an MDX file from content/pages/ and return its raw source string.
 * Used by Server Components that compile MDX via `compileMDX` from next-mdx-remote/rsc.
 */
export function getMdxContent(filename: string): string {
  // basename guard: only files directly inside content/pages can be read.
  const filePath = path.join(process.cwd(), 'content/pages', path.basename(filename))
  return fs.readFileSync(filePath, 'utf-8')
}
