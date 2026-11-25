import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdmin } = vi.hoisted(() => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/admin-auth', () => ({ requireAdmin }))
vi.mock('@/components/forms/FeedbackForm', () => ({ FeedbackForm: () => null }))

import { FeedbackForm } from '@/components/forms/FeedbackForm'
import AdminFeedbackPage, { metadata } from './page'

/** Every element in a (server-rendered, unexpanded) JSX tree. */
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(node)) return []
  return [node, ...elements(node.props.children as ReactNode)]
}

beforeEach(() => { vi.resetAllMocks() })

describe('admin feedback page (#37)', () => {
  it('stops before rendering when the staff session check fails', async () => {
    requireAdmin.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(AdminFeedbackPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(requireAdmin).toHaveBeenCalledTimes(1)
  })

  it('renders the shared public feedback form with admin page context after the check', async () => {
    requireAdmin.mockResolvedValue({ email: 'staff@example.test', actorId: 'staff', role: 'admin' })
    const tree = await AdminFeedbackPage()
    expect(requireAdmin).toHaveBeenCalledTimes(1)
    const forms = elements(tree).filter(el => el.type === FeedbackForm)
    expect(forms).toHaveLength(1)
    expect(forms[0].props.initialPagePath).toBe('/admin')
    expect(elements(tree).some(el => el.type === 'h1' && el.props.children === 'Send feedback')).toBe(true)
  })

  it('is never indexed', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
