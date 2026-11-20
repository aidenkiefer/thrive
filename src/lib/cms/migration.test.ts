import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const MIGRATION_PATH = 'supabase/migrations/20261119000000_publication_events.sql'
const SCHEMA_HEADER = '-- R2: publication_events (mirror of migrations/20261119000000_publication_events.sql)'

const migration = readFileSync(MIGRATION_PATH, 'utf8')
const schemaFull = readFileSync('supabase/schema.sql', 'utf8')
const schemaStart = schemaFull.indexOf(SCHEMA_HEADER)
// Only the R2 portion, so unrelated earlier content cannot satisfy or break assertions.
const schemaR2 = schemaStart === -1 ? '' : schemaFull.slice(schemaStart)

const targets: Array<[string, string]> = [
  ['migration', migration],
  ['schema.sql', schemaR2],
]

const FN = 'public\\.cms_set_published\\(text, uuid, boolean, uuid\\)'
const GUARD = 'public\\.publication_events_guard\\(\\)'
const T = 'public\\.publication_events'

describe('publication_events migration and schema (R2)', () => {
  it('schema.sql contains the R2 section at the end of the file', () => {
    expect(schemaStart).toBeGreaterThan(-1)
    expect(schemaFull.indexOf(SCHEMA_HEADER, schemaStart + 1)).toBe(-1)
  })

  it.each(targets)('%s defines the table with identity key, CHECKs, FK and index', (_n, s) => {
    expect(s).toMatch(/create table if not exists public\.publication_events/)
    expect(s).toContain('id           bigint generated always as identity primary key')
    expect(s).toMatch(/entity_type\s+text not null/)
    expect(s).toMatch(/entity_id\s+uuid not null/)
    expect(s).toMatch(/action\s+text not null/)
    expect(s).toMatch(/actor_id\s+uuid not null references public\.admin_staff_accounts \(actor_id\)/)
    expect(s).toMatch(/occurred_at\s+timestamptz not null default now\(\)/)
    for (const t of ['sermon_series', 'sermon', 'recurring_event', 'one_time_event', 'group', 'ministry', 'announcement', 'landing_page', 'outreach']) {
      expect(s).toContain(`'${t}'`)
    }
    expect(s).toContain(`check (action in ('publish', 'unpublish'))`)
    expect(s).toMatch(/create index if not exists publication_events_entity_idx\s+on public\.publication_events \(entity_type, entity_id, occurred_at desc\)/)
  })

  it.each(targets)('%s is append-only through a guard trigger', (_n, s) => {
    expect(s).toMatch(/create or replace function public\.publication_events_guard\(\)/)
    expect(s).toContain('raise exception \'publication_events is append-only')
    expect(s).toMatch(/before update on public\.publication_events/)
    expect(s).toMatch(/before delete on public\.publication_events/)
    expect(s).toMatch(/drop trigger if exists publication_events_guard_update/)
    expect(s).toMatch(/drop trigger if exists publication_events_guard_delete/)
  })

  it.each(targets)('%s is RLS-on with no policies and service-role-only access', (_n, s) => {
    expect(s).toMatch(/alter table public\.publication_events enable row level security/)
    expect(s).not.toMatch(/create policy/i)
    expect(s).toMatch(new RegExp(`revoke all on table ${T} from public;`))
    expect(s).toMatch(new RegExp(`revoke execute on function ${FN} from public;`))
    for (const role of ['anon', 'authenticated']) {
      expect(s).toMatch(new RegExp(`revoke all on table ${T} from ${role};`))
      expect(s).toMatch(new RegExp(`revoke execute on function ${FN} from ${role};`))
      expect(s).toMatch(new RegExp(`revoke execute on function ${GUARD} from ${role};`))
      expect(s).toContain(`rolname = '${role}'`)
    }
    expect(s).toMatch(new RegExp(`revoke all on table ${T} from service_role;`))
    expect(s).toMatch(new RegExp(`grant select, insert on table ${T} to service_role;`))
    expect(s).toMatch(new RegExp(`grant execute on function ${FN} to service_role;`))
    expect(s).not.toMatch(/grant\s+[^;]*\bupdate\b[^;]*\bon\s+table\s+public\.publication_events/i)
    expect(s).not.toMatch(/grant\s+[^;]*\bdelete\b[^;]*\bon\s+table\s+public\.publication_events/i)
    expect(s).not.toMatch(/grant\s+[^;]*\bto\s+(?:public|anon|authenticated)\b/i)
  })

  it.each(targets)('%s functions are security invoker with an empty search_path', (_n, s) => {
    expect((s.match(/^security invoker$/gm) ?? []).length).toBe(2)
    expect((s.match(/^set search_path = ''$/gm) ?? []).length).toBe(2)
    expect(s).not.toMatch(/security definer/i)
    expect(s).toMatch(/create or replace function public\.cms_set_published\(/)
    expect(s).toMatch(/returns timestamptz/)
  })

  it.each(targets)('%s maps entity types through a fixed whitelist and quotes identifiers', (_n, s) => {
    for (const [t, table] of [
      ['sermon_series', 'sermon_series'], ['sermon', 'sermons'], ['recurring_event', 'recurring_events'],
      ['one_time_event', 'one_time_events'], ['group', 'groups'], ['ministry', 'ministries'],
      ['announcement', 'announcements'], ['landing_page', 'landing_pages'], ['outreach', 'outreach'],
    ]) {
      expect(s).toMatch(new RegExp(`when '${t}'\\s+then '${table}'`))
    }
    expect(s).toMatch(/else null/)
    expect(s).toContain(`raise exception 'unknown entity type' using errcode = '22023'`)
    expect((s.match(/format\('[^']*public\.%I/g) ?? []).length).toBe(3)
    expect(s).not.toMatch(/format\('[^']*%s/)
    expect(s).toMatch(/where id = \$1 for update/)
    expect(s).toMatch(/using p_entity_id;/)
  })

  it.each(targets)('%s requires an active staff actor and reports missing rows', (_n, s) => {
    expect(s).toMatch(/where actor_id = p_actor_id and status = 'active'/)
    expect(s).toContain(`raise exception 'inactive or unknown staff actor' using errcode = '42501'`)
    expect(s).toContain(`using errcode = 'P0002'`)
  })

  it.each(targets)('%s flips state and logs an event only on a real change', (_n, s) => {
    expect(s).toMatch(/if p_publish and v_current is null then/)
    expect(s).toMatch(/elsif not p_publish and v_current is not null then/)
    expect(s).toContain(`'publish', p_actor_id`)
    expect(s).toContain(`'unpublish', p_actor_id`)
  })

  it.each(targets)('%s blocks TRUNCATE with a statement trigger', (_n, s) => {
    expect(s).toMatch(/before truncate on public\.publication_events\s+for each statement execute function public\.publication_events_guard\(\)/)
  })

  it('migration runs in one transaction', () => {
    expect(migration).toMatch(/^begin;$/m)
    expect(migration.trimEnd().endsWith('commit;')).toBe(true)
  })

  it('schema.sql mirror SQL matches the migration body', () => {
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
    const migBody = migration.slice(migration.indexOf('\nbegin;\n') + '\nbegin;\n'.length, migration.lastIndexOf('commit;'))
    const rule = '-- ' + '='.repeat(77)
    const rest = schemaR2.slice(schemaR2.indexOf(rule) + rule.length)
    // Stop at the next section header so later appended mirrors don't break this test.
    const next = rest.indexOf('\n' + rule)
    const afterHeader = next === -1 ? rest : rest.slice(0, next)
    expect(norm(afterHeader)).toBe(norm(migBody))
  })
})
