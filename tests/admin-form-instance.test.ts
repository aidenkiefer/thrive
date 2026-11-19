import { describe, expect, it } from 'vitest'
import {
  formInstanceFromReferer, instanceKey, newFormInstance, parseFormInstance,
} from '../src/lib/admin-form-instance'

describe('form instance token', () => {
  it('generates tokens that pass validation and differ each time', () => {
    const a = newFormInstance()
    expect(parseFormInstance(a)).toBe(a)
    expect(newFormInstance()).not.toBe(a)
  })

  it.each([undefined, '', 'short', 'a'.repeat(65), 'has space 12345', '../../etc/passwd', 'x=1&y=2abc', '<script>1</script>'])(
    'rejects %j', (value) => expect(parseFormInstance(value)).toBeUndefined())

  it('reads the token from a referer and ignores everything else in it', () => {
    const t = newFormInstance()
    expect(formInstanceFromReferer(`https://x.test/admin/events?error=Bad&form=new&fi=${t}#form-new`)).toBe(t)
    expect(formInstanceFromReferer('https://x.test/admin/events?fi=bad!')).toBeUndefined()
    expect(formInstanceFromReferer('https://x.test/admin/events')).toBeUndefined()
    expect(formInstanceFromReferer('not a url')).toBeUndefined()
    expect(formInstanceFromReferer(null)).toBeUndefined()
    expect(formInstanceFromReferer(`https://x.test/?fi=${'a'.repeat(3000)}`)).toBeUndefined()
  })

  it('keeps one key from save through later rejected saves, new key on next save', () => {
    const t1 = newFormInstance()
    const afterSave = instanceKey('new', t1)
    const afterInvalid = instanceKey('new', formInstanceFromReferer(`https://x.test/p?saved=new&fi=${t1}`)) // error redirect reuses t1
    expect(afterInvalid).toBe(afterSave)
    expect(instanceKey('new', newFormInstance())).not.toBe(afterSave)
    expect(instanceKey('new', undefined)).toBe('new')
  })
})
