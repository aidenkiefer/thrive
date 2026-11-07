import { randomBytes, scryptSync } from 'node:crypto'

const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const password = Buffer.concat(chunks).toString('utf8').replace(/[\r\n]+$/, '')
if (password.length < 16) {
  console.error('Use a password of at least 16 characters.')
  process.exitCode = 1
} else {
  const salt = randomBytes(32)
  const hash = scryptSync(password, salt, 64)
  console.log(`${salt.toString('hex')}:${hash.toString('hex')}`)
}
