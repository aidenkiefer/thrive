import { describe, expect, it } from 'vitest'
import { serializeJsonLd } from './serialize'

describe('serializeJsonLd', () => {
  it('escapes < so </script> cannot break out of the tag', () => {
    // Test fixture: hostile string, not ministry data.
    const out = serializeJsonLd({ name: 'x</script><script>alert(1)</script>' })
    expect(out).not.toContain('<')
    expect(out).toContain('\\u003c/script>')
    expect(JSON.parse(out).name).toBe('x</script><script>alert(1)</script>')
  })
})
