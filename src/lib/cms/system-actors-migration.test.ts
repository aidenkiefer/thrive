import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const MIGRATION_PATH = 'supabase/migrations/20261120000000_system_actors.sql'
const SCHEMA_HEADER = '-- D2: system actors and the published_at INSERT guard (mirror of migrations/20261120000000_system_actors.sql)'
const RULE = '-- ' + '='.repeat(77)

const migration = readFileSync(MIGRATION_PATH, 'utf8')
const schemaFull = readFileSync('supabase/schema.sql', 'utf8')
const schemaStart = schemaFull.indexOf(SCHEMA_HEADER)
// Only the D2 section body: after the rule that closes its header, up to the next section rule.
const bodyStart = schemaStart === -1 ? -1 : schemaFull.indexOf(RULE, schemaStart) + RULE.length
const bodyEnd = bodyStart === -1 ? -1 : schemaFull.indexOf('\n' + RULE, bodyStart)
const schemaD2 = bodyStart === -1 ? '' : schemaFull.slice(bodyStart, bodyEnd === -1 ? undefined : bodyEnd)
const migBody = migration.slice(migration.indexOf('\nbegin;\n') + '\nbegin;\n'.length, migration.lastIndexOf('commit;'))

const targets: Array<[string, string]> = [
  ['migration', migBody],
  ['schema.sql', schemaD2],
]

const TABLES = [
  'sermon_series', 'sermons', 'recurring_events', 'one_time_events', 'groups',
  'ministries', 'announcements', 'landing_pages', 'outreach',
]
const FN5 = 'public\\.cms_set_published\\(text, uuid, boolean, uuid, timestamptz\\)'

describe('system actors and INSERT guard migration and schema (#94)', () => {
  it('schema.sql contains the D2 section exactly once, after the R2b section', () => {
    expect(schemaStart).toBeGreaterThan(-1)
    expect(schemaFull.indexOf(SCHEMA_HEADER, schemaStart + 1)).toBe(-1)
    expect(schemaStart).toBeGreaterThan(schemaFull.indexOf('-- R2b: published_at guard (mirror of'))
  })

  it('schema.sql mirror SQL matches the migration body', () => {
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
    expect(norm(schemaD2).length).toBeGreaterThan(0)
    expect(norm(schemaD2)).toBe(norm(migBody))
  })

  it('migration runs in one transaction and says to apply before deploy', () => {
    expect(migration).toMatch(/^begin;$/m)
    expect(migration.trimEnd().endsWith('commit;')).toBe(true)
    expect(migration.slice(0, migration.indexOf('\nbegin;\n'))).toMatch(/Apply BEFORE deploying/)
  })

  it.each(targets)('%s gives system rows no email, no auth user, a name and the staff role', (_n, s) => {
    expect(s).toContain(`add column if not exists kind text not null default 'staff'`)
    expect(s).toContain(`check (kind in ('staff', 'system'))`)
    expect(s).toMatch(/kind = 'staff' and email is not null and auth_user_id is not null and name is null/)
    expect(s).toMatch(/kind = 'system' and email is null and auth_user_id is null and role = 'staff'\s+and name is not null/)
    expect(s).toContain(`raise exception 'admin_staff_accounts.kind and name are immutable'`)
    expect(s).toContain(`insert into admin_staff_accounts (kind, name) values ('system', 'seed')`)
    expect(s).toMatch(/on conflict \(name\) do nothing;/)
  })

  it.each(targets)('%s lets only a system actor set a past publish time, then delegates the staff form', (_n, s) => {
    expect(s).toMatch(/create or replace function public\.cms_set_published\(\s+p_entity_type text,\s+p_entity_id uuid,\s+p_publish boolean,\s+p_actor_id uuid,\s+p_published_at timestamptz\s+\) returns timestamptz/)
    expect(s).toMatch(/if v_kind <> 'system' then\s+raise exception 'only a system actor may set the publish time' using errcode = '42501'/)
    expect(s).toContain(`raise exception 'a publish time applies only to publishing' using errcode = '22023'`)
    expect(s).toContain(`raise exception 'publish time cannot be in the future' using errcode = '22023'`)
    expect(s).toContain('v_current := coalesce(p_published_at, v_now);')
    expect(s).toContain('return public.cms_set_published(p_entity_type, p_entity_id, p_publish, p_actor_id, null::timestamptz);')
    expect(s).not.toMatch(/security definer/i)
  })

  it.each(targets)('%s attaches the INSERT guard to all 9 publishable tables, idempotently', (_n, s) => {
    for (const t of TABLES) {
      expect(s).toContain(`drop trigger if exists published_at_insert_guard on public.${t};`)
      expect(s).toMatch(new RegExp(
        `create trigger published_at_insert_guard before insert on public\\.${t}\\s+for each row execute function public\\.published_at_guard\\(\\);`,
      ))
    }
    expect((s.match(/^create trigger published_at_insert_guard /gm) ?? []).length).toBe(TABLES.length)
    expect(s).toMatch(/if tg_op = 'INSERT' then\s+if new\.published_at is not null then/)
  })

  it.each(targets)('%s keeps the 5-argument form service-role-only', (_n, s) => {
    expect(s).toMatch(new RegExp(`revoke execute on function ${FN5} from public;`))
    for (const role of ['anon', 'authenticated']) {
      expect(s).toMatch(new RegExp(`revoke execute on function ${FN5} from ${role};`))
    }
    expect(s).toMatch(new RegExp(`grant execute on function ${FN5} to service_role;`))
    expect(s).not.toMatch(/grant\s+[^;]*\bto\s+(?:public|anon|authenticated)\b/i)
  })
})
