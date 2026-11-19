import type { ElementType } from 'react'
import { compileMDX } from 'next-mdx-remote/rsc'
import { mdxComponents } from './mdx-components'
import { SITE } from './site-info'

/**
 * Compile a structural page from content/pages/*.mdx.
 *
 * Trust boundary: `blockJS: false` lets MDX use JSX expressions such as
 * `columns={4}` and `{SITE.email}`. That is only safe because these files are
 * repo-authored and reviewed in pull requests. MDX must NEVER be compiled from
 * user, staff-editor, or database input; staff-editable pages use the structured
 * payload described in docs/plans/specs/2026-11-18-mvp-development-architecture.md.
 * `blockDangerousJS` stays on, so eval, Function, process and require remain blocked.
 */
export async function compilePageMdx({
  source,
  components = {},
}: {
  source: string
  components?: Record<string, ElementType>
}) {
  return compileMDX({
    source,
    components: { ...mdxComponents, ...components },
    options: {
      parseFrontmatter: true,
      blockJS: false,
      blockDangerousJS: true,
      scope: { SITE },
    },
  })
}
