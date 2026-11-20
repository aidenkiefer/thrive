import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const MIGRATION_PATH = 'supabase/migrations/20261119010000_published_at_guard.sql'
const SCHEMA_HEADER = '-- R2b: published_at guard (mirror of migrations/20261119010000_published_at_guard.sql)'
const RULE = '-- ' + '='.repeat(77)

const migration = readFileSync(MIGRATION_PATH, 'utf8')
const schemaFull = readFileSync('supabase/schema.sql', 'utf8')
const schemaStart = schemaFull.indexOf(SCHEMA_HEADER)
// Only the R2b section body: after the rule that closes its header, up to the next section rule.
const bodyStart = schemaStart === -1 ? -1 : schemaFull.indexOf(RULE, schemaStart) + RULE.length
const bodyEnd = bodyStart === -1 ? -1 : schemaFull.indexOf('\n' + RULE, bodyStart)
const schemaR2b = bodyStart === -1 ? '' : schemaFull.slice(bodyStart, bodyEnd === -1 ? undefined : bodyEnd)
const migBody = migration.slice(migration.indexOf('\nbegin;\n') + '\nbegin;\n'.length, migration.lastIndexOf('commit;'))

const targets: Array<[string, string]> = [
  ['migration', migBody],
  ['schema.sql', schemaR2b],
]

const TABLES = [
  'sermon_series', 'sermons', 'recurring_events', 'one_time_events', 'groups',
  'ministries', 'announcements', 'landing_pages', 'outreach',
]
const FN = 'public\\.cms_set_published\\(text, uuid, boolean, uuid\\)'
const GUARD = 'public\\.published_at_guard\\(\\)'

describe('published_at guard migration and schema (R2b)', () => {
  it('schema.sql contains the R2b section exactly once, after the R2 section', () => {
    expect(schemaStart).toBeGreaterThan(-1)
    expect(schemaFull.indexOf(SCHEMA_HEADER, schemaStart + 1)).toBe(-1)
    expect(schemaStart).toBeGreaterThan(schemaFull.indexOf('-- R2: publication_events (mirror of'))
  })

  it('schema.sql mirror SQL matches the migration body', () => {
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
    expect(norm(schemaR2b).length).toBeGreaterThan(0)
    expect(norm(schemaR2b)).toBe(norm(migBody))
  })

  it('migration runs in one transaction', () => {
    expect(migration).toMatch(/^begin;$/m)
    expect(migration.trimEnd().endsWith('commit;')).toBe(true)
  })

  it('migration header documents the GUC safety and the INSERT gap', () => {
    const header = migration.slice(0, migration.indexOf('\nbegin;\n'))
    expect(header).toMatch(/PostgREST/)
    expect(header).toMatch(/INSERT is NOT guarded/)
    expect(header).toMatch(/seed-current\.ts/)
  })

  it.each(targets)('%s attaches the guard trigger to all 9 publishable tables, idempotently', (_n, s) => {
    for (const t of TABLES) {
      expect(s).toContain(`drop trigger if exists published_at_guard on public.${t};`)
      expect(s).toMatch(new RegExp(
        `create trigger published_at_guard before update of published_at on public\\.${t}\\s+for each row execute function ${GUARD};`,
      ))
    }
    expect((s.match(/^create trigger published_at_guard /gm) ?? []).length).toBe(TABLES.length)
    expect(s).not.toMatch(/before insert/i)
  })

  it.each(targets)('%s guard raises only on a real change without the cms_set_published mark', (_n, s) => {
    expect(s).toMatch(/create or replace function public\.published_at_guard\(\) returns trigger/)
    expect(s).toMatch(/new\.published_at is distinct from old\.published_at/)
    expect(s).toMatch(/current_setting\('thrive\.cms_set_published', true\)/)
    expect(s).toMatch(/<> 'on'/)
    expect(s).toContain(`raise exception 'published_at changes only through cms_set_published'`)
    expect(s).toContain(`using errcode = 'P0001'`)
    expect(s).toMatch(/return new;/)
  })

  it.each(targets)('%s cms_set_published sets the mark on just before each update and off right after', (_n, s) => {
    const on = `set_config('thrive.cms_set_published', 'on', true);`
    const off = `set_config('thrive.cms_set_published', 'off', true);`
    expect((s.split(on).length - 1)).toBe(2)
    expect((s.split(off).length - 1)).toBe(2)
    const updates = [
      /perform pg_catalog\.set_config\('thrive\.cms_set_published', 'on', true\);\s+execute format\('update public\.%I set published_at = \$1 where id = \$2', v_table\)\s+using v_now, p_entity_id;\s+perform pg_catalog\.set_config\('thrive\.cms_set_published', 'off', true\);/,
      /perform pg_catalog\.set_config\('thrive\.cms_set_published', 'on', true\);\s+execute format\('update public\.%I set published_at = null where id = \$1', v_table\)\s+using p_entity_id;\s+perform pg_catalog\.set_config\('thrive\.cms_set_published', 'off', true\);/,
    ]
    for (const re of updates) expect(s).toMatch(re)
  })

  it.each(targets)('%s keeps cms_set_published behaviour from R2', (_n, s) => {
    expect(s).toMatch(/create or replace function public\.cms_set_published\(\s+p_entity_type text,\s+p_entity_id uuid,\s+p_publish boolean,\s+p_actor_id uuid\s+\) returns timestamptz/)
    for (const [t, table] of [
      ['sermon_series', 'sermon_series'], ['sermon', 'sermons'], ['recurring_event', 'recurring_events'],
      ['one_time_event', 'one_time_events'], ['group', 'groups'], ['ministry', 'ministries'],
      ['announcement', 'announcements'], ['landing_page', 'landing_pages'], ['outreach', 'outreach'],
    ]) {
      expect(s).toMatch(new RegExp(`when '${t}'\\s+then '${table}'`))
    }
    expect(s).toContain(`raise exception 'unknown entity type' using errcode = '22023'`)
    expect(s).toContain(`raise exception 'publish flag is required' using errcode = '22023'`)
    expect(s).toMatch(/where actor_id = p_actor_id and status = 'active'/)
    expect(s).toContain(`raise exception 'inactive or unknown staff actor' using errcode = '42501'`)
    expect(s).toMatch(/where id = \$1 for update/)
    expect(s).toContain(`using errcode = 'P0002'`)
    expect(s).toMatch(/if p_publish and v_current is null then/)
    expect(s).toMatch(/elsif not p_publish and v_current is not null then/)
    expect(s).toContain(`'publish', p_actor_id`)
    expect(s).toContain(`'unpublish', p_actor_id`)
    expect((s.match(/format\('[^']*public\.%I/g) ?? []).length).toBe(3)
    expect(s).not.toMatch(/format\('[^']*%s/)
  })

  it.each(targets)('%s functions are security invoker with an empty search_path', (_n, s) => {
    expect((s.match(/^security invoker$/gm) ?? []).length).toBe(2)
    expect((s.match(/^set search_path = ''$/gm) ?? []).length).toBe(2)
    expect(s).not.toMatch(/security definer/i)
  })

  it.each(targets)('%s revokes the trigger function and keeps cms_set_published service-role-only', (_n, s) => {
    expect(s).toMatch(new RegExp(`revoke execute on function ${GUARD} from public;`))
    expect(s).toMatch(new RegExp(`revoke execute on function ${FN} from public;`))
    for (const role of ['anon', 'authenticated']) {
      expect(s).toContain(`rolname = '${role}'`)
      expect(s).toMatch(new RegExp(`revoke execute on function ${GUARD} from ${role};`))
      expect(s).toMatch(new RegExp(`revoke execute on function ${FN} from ${role};`))
    }
    expect(s).toMatch(new RegExp(`grant execute on function ${FN} to service_role;`))
    expect(s).not.toMatch(/grant\s+[^;]*\bto\s+(?:public|anon|authenticated)\b/i)
    expect(s).not.toMatch(/grant\s+[^;]*published_at_guard/i)
  })
})
