import { describe, expect, it } from 'vitest'
import {
  formResetToken, newFormInstance, nextResetState, parseFormInstance, type ResetState,
} from '../src/lib/admin-form-instance'

describe('form instance token', () => {
  it('generates tokens that pass validation and differ each time', () => {
    const a = newFormInstance()
    expect(parseFormInstance(a)).toBe(a)
    expect(newFormInstance()).not.toBe(a)
  })

  it.each([undefined, '', 'short', 'a'.repeat(65), 'has space 12345', '../../etc/passwd', 'x=1&y=2abc', '<script>1</script>'])(
    'rejects %j', (value) => expect(parseFormInstance(value)).toBeUndefined())
})

describe('formResetToken', () => {
  const t = newFormInstance()
  it('goes only to the form that saved', () => {
    const fb = { saved: 'a', form: 'a', instance: t }
    expect(formResetToken(fb, 'a')).toBe(t)
    expect(formResetToken(fb, 'b')).toBeUndefined()
    expect(formResetToken(undefined, 'a')).toBeUndefined()
  })
  it('is never issued for a rejected save', () => {
    expect(formResetToken({ error: 'Bad', form: 'a' }, 'a')).toBeUndefined()
  })
})

describe('nextResetState (per-form remount)', () => {
  const fresh = (seen?: string): ResetState => ({ seen, epoch: 0 })

  it('keeps first-load token without remounting', () => {
    const t = newFormInstance()
    expect(nextResetState(fresh(t), t).epoch).toBe(0)
  })

  it('remounts only the saved form; a sibling given no token keeps its edits', () => {
    const t = newFormInstance()
    const a = nextResetState(fresh(), t)
    const b = nextResetState(fresh(), undefined)
    expect(a.epoch).toBe(1)
    expect(b.epoch).toBe(0)
  })

  it('save A, then invalid B (no token anywhere): neither form remounts', () => {
    const t = newFormInstance()
    const a1 = nextResetState(fresh(), t)
    const a2 = nextResetState(a1, undefined)
    expect(a2).toBe(a1)
    expect(nextResetState(fresh(), undefined).epoch).toBe(0)
  })

  it('save A, invalid A, save A again: remounts on each real save only', () => {
    let a = nextResetState(fresh(), newFormInstance())
    a = nextResetState(a, undefined)
    expect(a.epoch).toBe(1)
    a = nextResetState(a, newFormInstance())
    expect(a.epoch).toBe(2)
  })

  it('save A, save B: A keeps its seen token and epoch', () => {
    const tA = newFormInstance()
    const a = nextResetState(fresh(), tA)
    expect(nextResetState(a, undefined)).toBe(a) // B saved: A sees no token
  })

  it('same token seen again (re-render) does not remount', () => {
    const t = newFormInstance()
    const a = nextResetState(fresh(), t)
    expect(nextResetState(a, t)).toBe(a)
  })
})
