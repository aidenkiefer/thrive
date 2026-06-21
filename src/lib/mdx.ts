import fs from 'fs'
import path from 'path'

/**
 * Read an MDX file from content/pages/ and return its raw source string.
 * Used by Server Components that compile MDX via `compileMDX` from next-mdx-remote/rsc.
 */
export function getMdxContent(filename: string): string {
  const filePath = path.join(process.cwd(), 'content/pages', filename)
  return fs.readFileSync(filePath, 'utf-8')
}
