// #45 RLS matrix: what anon and authenticated can read and write, checked on the
// disposable Postgres of scripts/pg-rehearsal (rehearse-pg.mjs calls this on each
// migrated database). Plain ESM so the standalone harness can import it.
//
// Everything runs in one transaction on the superuser connection and is rolled
// back: seed a published and a draft row per content table, then probe as each
// role with `set local role`. Expected errors are caught behind savepoints.

/** The 12 content tables: anon may read published rows only (speakers/staff: every row, minus contact columns). */
export const CONTENT_TABLES = [
  'speakers', 'sermon_series', 'sermons', 'recurring_events', 'event_occurrences', 'one_time_events',
  'groups', 'ministries', 'announcements', 'staff', 'landing_pages', 'outreach',
];
/** Tables only the service role may touch. */
export const SERVICE_TABLES = ['admin_staff_accounts', 'rate_limit_buckets', 'publication_events'];
/** No draft concept by design: every row is public, privacy comes from column grants. */
const ALL_ROWS = { speakers: ['email'], staff: ['email', 'phone'] };
const ROLES = ['anon', 'authenticated'];
/** Draft inserts, then published through cms_set_published. The INSERT guard refuses a non-null published_at. */
const PUBLISH = [
  ['sermon_series', 'sermon_series', 'slug', 'rlsm-pub'],
  ['sermons', 'sermon', 'slug', 'rlsm-pub'],
  ['recurring_events', 'recurring_event', 'slug', 'rlsm-pub'],
  ['one_time_events', 'one_time_event', 'slug', 'rlsm-pub'],
  ['groups', 'group', 'slug', 'rlsm-pub'],
  ['ministries', 'ministry', 'slug', 'rlsm-pub'],
  ['landing_pages', 'landing_page', 'slug', 'rlsm-pub'],
  ['outreach', 'outreach', 'slug', 'rlsm-pub'],
  ['announcements', 'announcement', 'title', 'rlsm-pub'],
  ['announcements', 'announcement', 'title', 'rlsm-expired'],
];

/** Seed rows, all tagged rlsm-*. Returns nothing; ids are looked up by slug/title. */
const SEED = `
  insert into speakers (slug, name, email) values ('rlsm-speaker', 'S', 'private@example.com');
  insert into staff (slug, name, email, phone) values ('rlsm-staff', 'T', 'private@example.com', '555-0100');
  insert into sermon_series (slug, title) values ('rlsm-pub', 'P'), ('rlsm-draft', 'D');
  insert into sermons (slug, title, preached_at) values ('rlsm-pub', 'P', current_date), ('rlsm-draft', 'D', current_date);
  insert into recurring_events (slug, name) values ('rlsm-pub', 'P'), ('rlsm-draft', 'D');
  insert into one_time_events (slug, name, start_datetime) values ('rlsm-pub', 'P', now()), ('rlsm-draft', 'D', now());
  insert into groups (slug, name) values ('rlsm-pub', 'P'), ('rlsm-draft', 'D');
  insert into ministries (slug, name) values ('rlsm-pub', 'P'), ('rlsm-draft', 'D');
  insert into landing_pages (slug, title) values ('rlsm-pub', 'P'), ('rlsm-draft', 'D');
  insert into outreach (slug, name) values ('rlsm-pub', 'P'), ('rlsm-draft', 'D');
  insert into announcements (title, expires_at) values
    ('rlsm-pub', null), ('rlsm-draft', null), ('rlsm-expired', now() - interval '1 hour');
  insert into event_occurrences (recurring_event_id, start_datetime, cancelled)
    select id, now(), false from recurring_events where slug = 'rlsm-pub' union all
    select id, now() + interval '1 day', true from recurring_events where slug = 'rlsm-pub' union all
    select id, now(), false from recurring_events where slug = 'rlsm-draft';
`;
const keyCol = (t) => (t === 'announcements' ? 'title' : 'slug');

/** Visible test rows for the current role, as a sorted list of labels. */
async function visible(db, table) {
  if (table === 'event_occurrences') {
    const { rows } = await db.query(`
      select case when cancelled then 'cancelled' else 'live' end as k
      from event_occurrences where start_datetime > now() - interval '1 hour'`);
    return rows.map((r) => r.k).sort();
  }
  const k = keyCol(table);
  const { rows } = await db.query(`select ${k} as k from ${table} where ${k} like 'rlsm-%'`);
  return rows.map((r) => r.k).sort();
}

async function tryQuery(db, sql) {
  await db.query('savepoint p');
  try {
    const r = await db.query(sql);
    await db.query('release savepoint p');
    return { ok: true, rowCount: r.rowCount };
  } catch (e) {
    await db.query('rollback to savepoint p');
    return { ok: false, code: e.code };
  }
}

const WRITE_PROBES = {
  insert: (t) => (t === 'event_occurrences'
    ? `insert into event_occurrences (recurring_event_id, start_datetime) select id, now() from recurring_events limit 1`
    : t === 'announcements' ? `insert into announcements (title) values ('rlsm-new')`
    : t === 'sermons' ? `insert into sermons (slug, title, preached_at) values ('rlsm-new', 'N', current_date)`
    : t === 'one_time_events' ? `insert into one_time_events (slug, name, start_datetime) values ('rlsm-new', 'N', now())`
    : `insert into ${t} (slug, ${t === 'sermon_series' || t === 'landing_pages' ? 'title' : 'name'}) values ('rlsm-new', 'N')`),
  update: (t) => `update ${t} set created_at = created_at`,
  delete: (t) => `delete from ${t}`,
};

/**
 * @param db superuser pg client on a fully migrated database
 * @param s scenario label for record()
 * @param record (scenario, item, ok, detail) => void
 * @returns notes for the session log (known-risk observations, not failures)
 */
export async function assertRlsMatrix(db, s, record) {
  const notes = [];
  const { rows: tables } = await db.query(`select tablename from pg_tables where schemaname = 'public' order by 1`);
  const unknown = tables.map((r) => r.tablename).filter((t) => !CONTENT_TABLES.includes(t) && !SERVICE_TABLES.includes(t));
  record(s, 'RLS matrix: every public table is classified (content or service-only)', unknown.length === 0, unknown.join(', '));

  for (const t of [...CONTENT_TABLES, ...SERVICE_TABLES]) {
    const { rows: [r] } = await db.query(`select relrowsecurity v from pg_class where oid = 'public.${t}'::regclass`);
    record(s, `RLS matrix: RLS enabled on ${t}`, r.v === true);
  }

  await db.query('begin');
  try {
    await db.query(SEED);
    const { rows: [seedActor] } = await db.query(`select actor_id from public.admin_staff_accounts where name = 'seed'`);
    for (const [table, entity, col, key] of PUBLISH) {
      const { rows: [row] } = await db.query(`select id from public.${table} where ${col} = $1`, [key]);
      await db.query(
        `select public.cms_set_published($1, $2, true, $3, now() - interval '1 day')`,
        [entity, row.id, seedActor.actor_id],
      );
    }
    for (const role of ROLES) {
      await db.query(`set local role ${role}`);
      for (const t of CONTENT_TABLES) {
        const got = await tryQuery(db, `select 1 from ${t} limit 0`);
        if (!got.ok && !ALL_ROWS[t]) { record(s, `RLS matrix: ${role} can read published ${t}`, false, `error ${got.code}`); continue; }
        if (t === 'event_occurrences') {
          const seen = await visible(db, t);
          record(s, `RLS matrix: ${role} sees only live occurrences of published events`, JSON.stringify(seen) === '["live"]', seen.join(','));
        } else if (ALL_ROWS[t]) {
          const { rows } = await db.query(`select slug from ${t} where slug like 'rlsm-%'`);
          record(s, `RLS matrix: ${role} reads every ${t} row (using true, no draft concept)`, rows.length === 1);
          for (const col of ALL_ROWS[t]) {
            const r = await tryQuery(db, `select ${col} from ${t}`);
            record(s, `RLS matrix: ${role} cannot read ${t}.${col}`, !r.ok && r.code === '42501', r.ok ? 'readable' : r.code);
          }
        } else {
          const seen = await visible(db, t);
          record(s, `RLS matrix: ${role} sees published ${t} only (no drafts${t === 'announcements' ? ', no expired' : ''})`,
            JSON.stringify(seen) === '["rlsm-pub"]', seen.join(','));
        }
        for (const [op, sql] of Object.entries(WRITE_PROBES)) {
          const r = await tryQuery(db, sql(t));
          // Denied = permission error, RLS error, or zero rows touched (no write policy matches).
          const denied = !r.ok || r.rowCount === 0;
          record(s, `RLS matrix: ${role} cannot ${op} ${t}`, denied, r.ok ? `${r.rowCount} rows` : r.code);
        }
      }
      for (const t of SERVICE_TABLES) {
        const r = await tryQuery(db, `select 1 from ${t} limit 1`);
        record(s, `RLS matrix: ${role} cannot read ${t}`, !r.ok && r.code === '42501', r.ok ? 'readable' : r.code);
      }
      for (const fn of ['take_rate_limit(text, text, integer, integer)', 'prune_rate_limit_buckets(integer)']) {
        const { rows: [r] } = await db.query(`select has_function_privilege('${role}', 'public.${fn}', 'execute') v`);
        record(s, `RLS matrix: ${role} cannot execute ${fn.split('(')[0]}`, r.v === false);
      }
      await db.query('reset role');
      // TRUNCATE ignores RLS. Not reachable through PostgREST (no truncate endpoint, roles are nologin),
      // so it is a note for the owner, not a failure.
      const { rows: tr } = await db.query(
        `select string_agg(t, ', ' order by t) v from unnest($1::text[]) t where has_table_privilege($2, 'public.' || t, 'truncate')`,
        [CONTENT_TABLES, role]);
      if (tr[0].v) notes.push(`${role} holds TRUNCATE on content tables (${tr[0].v}); RLS does not cover TRUNCATE`);
    }
  } finally {
    await db.query('rollback');
  }
  return notes;
}
