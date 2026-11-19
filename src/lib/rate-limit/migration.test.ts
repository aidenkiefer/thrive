import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const MIGRATION_PATH = 'supabase/migrations/20261118010000_shared_rate_limit.sql'
const SCHEMA_HEADER = '-- D1L: rate_limit_buckets (mirror of migrations/20261118010000_shared_rate_limit.sql)'

const migration = readFileSync(MIGRATION_PATH, 'utf8')
const schemaFull = readFileSync('supabase/schema.sql', 'utf8')
const schemaStart = schemaFull.indexOf(SCHEMA_HEADER)
// Only the D1L portion, so unrelated earlier content cannot satisfy or break assertions.
const schemaD1L = schemaStart === -1 ? '' : schemaFull.slice(schemaStart)

const targets: Array<[string, string]> = [
  ['migration', migration],
  ['schema.sql', schemaD1L],
]

const fnSig = {
  take: 'public\\.take_rate_limit\\(text, text, integer, integer\\)',
  prune: 'public\\.prune_rate_limit_buckets\\(integer\\)',
}

function count(s: string, re: RegExp): number {
  return (s.match(re) ?? []).length
}

describe('shared rate limiter migration and schema (D1L)', () => {
  it('schema.sql contains the D1L section', () => {
    expect(schemaStart).toBeGreaterThan(-1)
  })

  it.each(targets)('%s defines the table, index, and functions', (_n, s) => {
    expect(s).toMatch(/create table if not exists public\.rate_limit_buckets/)
    expect(s).toMatch(/create index if not exists rate_limit_buckets_expires_at_idx/)
    expect(s).toMatch(/create or replace function public\.take_rate_limit/)
    expect(s).toMatch(/create or replace function public\.prune_rate_limit_buckets/)
  })

  it.each(targets)('%s stores only a hash subject and keys per window', (_n, s) => {
    expect(s).toContain(`subject_hash ~ '^[0-9a-f]{64}$'`)
    expect(s).toContain('primary key (purpose, window_seconds, subject_hash)')
  })

  it.each(targets)('%s keeps the table free of personal-data columns', (_n, s) => {
    const start = s.indexOf('create table if not exists public.rate_limit_buckets (')
    expect(start).toBeGreaterThan(-1)
    const end = s.indexOf(');', start)
    const def = s.slice(start, end)
    expect(def).toContain('subject_hash')
    expect(def).not.toMatch(/\b\w*(email|ip|address|body|content|payload)\w*\s+(text|inet|varchar|jsonb?|integer)/i)
    expect(def).not.toMatch(/^\s*(email|ip|ip_address|address|body|content|payload)\b/im)
  })

  it.each(targets)('%s is RLS-on with no policies and service-role-only access', (_n, s) => {
    expect(s).toMatch(/alter table public\.rate_limit_buckets enable row level security/)
    expect(s).not.toMatch(/create policy[^;]*rate_limit_buckets/i)
    for (const role of ['public', 'anon', 'authenticated']) {
      expect(s).toMatch(new RegExp(`revoke all on table public\\.rate_limit_buckets from ${role};`))
      expect(s).toMatch(new RegExp(`revoke execute on function ${fnSig.take} from ${role};`))
      expect(s).toMatch(new RegExp(`revoke execute on function ${fnSig.prune} from ${role};`))
    }
    expect(s).toMatch(new RegExp(`grant execute on function ${fnSig.take} to service_role;`))
    expect(s).toMatch(new RegExp(`grant execute on function ${fnSig.prune} to service_role;`))
    expect(s).toMatch(/grant select, insert, update, delete on table public\.rate_limit_buckets to service_role/)
    expect(s).not.toMatch(/grant\s+[^;]*\bon\s+(?:table\s+)?public\.rate_limit_buckets\s+to\s+(?:public|anon|authenticated)\b/i)
    expect(s).not.toMatch(/grant\s+[^;]*\bon\s+function\s+public\.(?:take_rate_limit|prune_rate_limit_buckets)\([^)]*\)\s+to\s+(?:public|anon|authenticated)\b/i)
  })

  it.each(targets)('%s functions are security invoker with an empty search_path', (_n, s) => {
    expect(count(s, /^security invoker$/gm)).toBe(2)
    expect(count(s, /^set search_path = ''$/gm)).toBe(2)
    expect(s).not.toMatch(/security definer/i)
  })

  it.each(targets)('%s uses an atomic bounded upsert', (_n, s) => {
    expect(s).toContain('on conflict (purpose, window_seconds, subject_hash) do update')
    expect(s).toContain('least(b.hits + 1, p_limit + 1)')
    expect(s).toMatch(/limit 25\b/)
    expect(s).toContain('for update skip locked')
    expect(s).toContain('p_max_rows > 10000')
  })

  it('migration runs in one transaction', () => {
    expect(migration).toMatch(/^begin;$/m)
    expect(migration.trimEnd().endsWith('commit;')).toBe(true)
  })

  it('schema.sql mirror SQL matches the migration body', () => {
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
    const migBody = migration.slice(migration.indexOf('\nbegin;\n') + '\nbegin;\n'.length, migration.lastIndexOf('commit;'))
    // Skip the section header block (two ===== lines around the title).
    const rule = '-- ' + '='.repeat(77)
    const afterHeader = schemaD1L.slice(schemaD1L.indexOf(rule) + rule.length)
    expect(norm(afterHeader)).toBe(norm(migBody))
  })
})
