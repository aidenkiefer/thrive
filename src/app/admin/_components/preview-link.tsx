import Link from 'next/link'

/** "Preview" link beside an admin list item; opens the staff-only draft preview. */
export function PreviewLink({ href, name }: { href: string; name: string }) {
  return (
    <Link href={href} aria-label={`Preview ${name}`} className="ml-2 inline-flex min-h-8 items-center rounded border bg-white px-2 text-sm font-normal text-brand-800 underline-offset-2 hover:underline">
      Preview
    </Link>
  )
}
