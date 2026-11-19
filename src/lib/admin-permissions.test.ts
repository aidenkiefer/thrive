import { describe, expect, it } from 'vitest'
import { can, parseStaffRole, STAFF_ROLES } from './admin-permissions'

describe('admin permissions', () => {
  it('limits staff account control to admins', () => {
    expect(can('admin', 'staff_accounts.manage')).toBe(true)
    expect(can('staff', 'staff_accounts.manage')).toBe(false)
  })
  it('lets every role edit content', () => {
    for (const role of STAFF_ROLES) expect(can(role, 'content.edit')).toBe(true)
  })
  it('denies everything without a role', () => {
    expect(can(null, 'content.edit')).toBe(false)
    expect(can(undefined, 'staff_accounts.manage')).toBe(false)
  })
  it('parses only known roles', () => {
    expect(parseStaffRole('admin')).toBe('admin')
    expect(parseStaffRole('staff')).toBe('staff')
    for (const raw of ['Admin', 'owner', '', null, undefined, 1, {}]) expect(parseStaffRole(raw)).toBeNull()
  })
})
