/**
 * Staff roles and what each may do. This is the only place roles are
 * interpreted: callers ask `can(role, permission)` (or `requirePermission` in
 * admin-auth.ts) and never compare role strings themselves.
 *
 * Owner decision (2026-11-19, #102): staff account control is admin-only; the
 * owner is the only admin for now. Add a permission here, with its roles, when
 * a new capability needs to differ between roles.
 */

export const STAFF_ROLES = ['admin', 'staff'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

const PERMISSIONS = {
  /** Edit and publish site content (every active staff account). */
  'content.edit': ['admin', 'staff'],
  /** Create, disable, re-enable, rebind, or change the role of staff accounts. */
  'staff_accounts.manage': ['admin'],
} as const satisfies Record<string, readonly StaffRole[]>

export type Permission = keyof typeof PERMISSIONS

/** Returns the role, or null for anything that is not a known role (fail closed). */
export function parseStaffRole(raw: unknown): StaffRole | null {
  return typeof raw === 'string' && (STAFF_ROLES as readonly string[]).includes(raw) ? (raw as StaffRole) : null
}

export function can(role: StaffRole | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return (PERMISSIONS[permission] as readonly StaffRole[]).includes(role)
}
