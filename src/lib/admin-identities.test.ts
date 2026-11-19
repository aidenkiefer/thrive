import { describe, expect, it } from 'vitest'
import { LEGACY_ISSUER, actorIdFor, parseAllowlist, resolveActor } from './admin-identities'

const ISS = 'https://idp.example'
const base = { NEXTAUTH_SECRET: 's', ADMIN_EMAIL: 'Shared@Example.org' }
const list = (...e: object[]) => JSON.stringify(e)

describe('resolveActor', () => {
  it('derives a stable actorId from issuer+subject, not email', () => {
    const env = { ...base, ADMIN_STAFF_ALLOWLIST: list({ issuer: ISS, subject: 'u1' }) }
    const a = resolveActor({ issuer: ISS, subject: 'u1', email: 'a@x.org' }, env)
    const b = resolveActor({ issuer: ISS, subject: 'u1', email: 'renamed@x.org' }, env)
    expect(a?.actorId).toBe(b?.actorId)
    expect(a?.actorId).toBe(actorIdFor(ISS, 'u1'))
    expect(a?.legacy).toBe(false)
  })
  it('gives distinct staff distinct actors', () => {
    expect(actorIdFor(ISS, 'u1')).not.toBe(actorIdFor(ISS, 'u2'))
    expect(actorIdFor(ISS, 'u1')).not.toBe(actorIdFor('https://other', 'u1'))
  })
  it('fails closed for unknown, removed, or unconfigured identities', () => {
    const env = { ...base, ADMIN_STAFF_ALLOWLIST: list({ issuer: ISS, subject: 'u1' }) }
    expect(resolveActor({ issuer: ISS, subject: 'u2' }, env)).toBeNull()
    expect(resolveActor({ issuer: ISS, subject: 'u1' }, { ...base })).toBeNull()
    expect(resolveActor({ issuer: ISS, subject: 'u1' }, { ...env, NEXTAUTH_SECRET: undefined })).toBeNull()
    expect(resolveActor(null, env)).toBeNull()
  })
  it('matches by subject even if email is allowlisted for someone else', () => {
    const env = { ...base, ADMIN_STAFF_ALLOWLIST: list({ issuer: ISS, subject: 'u1', email: 'a@x.org' }) }
    expect(resolveActor({ issuer: ISS, subject: 'evil', email: 'a@x.org' }, env)).toBeNull()
  })
  it('keeps the shared account working as a legacy actor until disabled', () => {
    const legacy = { issuer: LEGACY_ISSUER, subject: 'shared@example.org' }
    expect(resolveActor(legacy, base)).toMatchObject({ legacy: true, email: 'shared@example.org' })
    expect(resolveActor(legacy, { ...base, ADMIN_LEGACY_SHARED_ACCOUNT: 'disabled' })).toBeNull()
    expect(resolveActor({ ...legacy, subject: 'other@example.org' }, base)).toBeNull()
  })
})

describe('parseAllowlist', () => {
  it.each([undefined, '', 'not json', '{}', '[{"issuer":"i"}]', `[{"issuer":"${LEGACY_ISSUER}","subject":"x"}]`, '[{"issuer":"i","subject":"s"},1]'])(
    'returns empty for %s', raw => expect(parseAllowlist(raw)).toEqual([]))
})
