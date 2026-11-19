import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

// Next loads these files independently of the inherited environment.
for (const name of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  if (existsSync(name)) {
    throw new Error(`Run the smoke suite from a worktree without ${name}.`)
  }
}

const externalSetting = /SUPABASE|RESEND|LIMITER|UPSTASH|^NEXTAUTH_|^AUTH_|^ADMIN_|^VERCEL_ENV$/i
const env = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !externalSetting.test(name)),
)
env.NODE_ENV = 'production'

const { hostname, port } = new URL(process.env.SMOKE_BASE_URL)
const server = spawn(
  'npm run build && npm run start -- --hostname ' + hostname + ' --port ' + port,
  { env, shell: true, stdio: 'inherit' },
)
server.on('exit', code => {
  process.exitCode = code ?? 1
})
