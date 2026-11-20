// R2/R2b rehearsal: publication_events + cms_set_published + published_at guard on PGlite (disposable WASM Postgres).
// Covers draft/published visibility to anon, actor attribution, rejected actors, and direct published_at writes.
// Usage (from this directory): npm ci && node cms-rehearse.mjs [repo-root]   # exit 0 = all pass
// repo-root defaults to the repo this file is in. The June baseline schema comes
// from this checkout's git history (commit cd012bd).
import { PGlite } from '@electric-sql/pglite';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(process.argv[2] ?? join(here, '../..'));
const read = (p) => readFileSync(p, 'utf8');
const schemaSql = read(join(repo, 'supabase/schema.sql'));
const migDir = join(repo, 'supabase/migrations');
const migrations = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()
  .map((f) => ({ name: `migrations/${f}`, sql: read(join(migDir, f)) }));
const juneFull = execFileSync('git', ['-C', here, 'show', 'cd012bd:supabase/schema.sql'], { encoding: 'utf8' });
const juneNoPatch = juneFull.split('\n').slice(0, 304).join('\n');

let failures = 0, total = 0;
const record = (scenario, item, ok, detail = '') => {
  total++; if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${scenario}] ${item}${detail ? `  (${detail})` : ''}`);
};

const SUPABASE_STUBS = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;
const freshDb = async () => { const db = new PGlite(); await db.exec(SUPABASE_STUBS); return db; };

async function apply(db, scenario, name, sql) {
  try { await db.exec(sql); record(scenario, `apply ${name}`, true); }
  catch (e) { await db.exec('rollback').catch(() => {}); record(scenario, `apply ${name}`, false, e.message.split('\n')[0]); }
}
async function expectError(db, scenario, item, sql, code, params) {
  try {
    if (params) await db.query(sql, params); else await db.exec(sql);
    record(scenario, item, false, 'no error raised');
  } catch (e) {
    await db.exec('reset role').catch(() => {});
    record(scenario, item, e.code === code, `${e.code} ${e.message.split('\n')[0]}`);
  }
}
const one = async (db, sql, params) => (await db.query(sql, params)).rows[0];

async function snapshot(db) {
  const q = async (sql) => (await db.query(sql)).rows.map((r) => JSON.stringify(r)).sort();
  return {
    columns: await q(`select table_name, column_name, data_type, column_default, is_nullable, is_identity, identity_generation
                      from information_schema.columns where table_schema = 'public'`),
    constraints: await q(`select conrelid::regclass::text t, conname, pg_get_constraintdef(oid) d
                          from pg_constraint where connamespace = 'public'::regnamespace`),
    indexes: await q(`select tablename, indexname, indexdef from pg_indexes where schemaname = 'public'`),
    policies: await q(`select tablename, policyname, cmd, roles::text, qual, with_check from pg_policies where schemaname = 'public'`),
    rls: await q(`select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'`),
    tableAcl: await q(`select relname, relacl::text from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'`),
    functions: await q(`select proname, pg_get_function_identity_arguments(oid) a, md5(prosrc) src, prosecdef,
                        proconfig::text cfg, provolatile, proacl::text acl
                        from pg_proc where pronamespace = 'public'::regnamespace`),
    triggers: await q(`select tgrelid::regclass::text, tgname, pg_get_triggerdef(oid) from pg_trigger where not tgisinternal`),
  };
}
function compare(scenario, a, b, label) {
  for (const k of Object.keys(a)) {
    const onlyA = a[k].filter((x) => !b[k].includes(x));
    const onlyB = b[k].filter((x) => !a[k].includes(x));
    const ok = onlyA.length === 0 && onlyB.length === 0;
    record(scenario, `catalog ${k} identical to ${label}`, ok,
      ok ? `${a[k].length} rows` : `only fresh: ${onlyA.slice(0, 3).join(' | ')} ; only migrated: ${onlyB.slice(0, 3).join(' | ')}`);
  }
}

const PUB = 'public.publication_events';
const FN = 'public.cms_set_published(text,uuid,boolean,uuid)';

async function assertPublishing(db, s) {
  // Structure.
  const rls = await one(db, `select relrowsecurity from pg_class where oid = '${PUB}'::regclass`);
  record(s, 'RLS enabled on publication_events', rls.relrowsecurity === true);
  const pol = await one(db, `select count(*)::int n from pg_policies where schemaname='public' and tablename='publication_events'`);
  record(s, 'no policies on publication_events', pol.n === 0);
  const fn = await one(db, `select prosecdef, proconfig from pg_proc where oid = '${FN}'::regprocedure`);
  record(s, 'cms_set_published is security invoker with empty search_path',
    fn.prosecdef === false && JSON.stringify(fn.proconfig) === JSON.stringify(['search_path=""']));
  const pub = await one(db, `select
      (select count(*) from pg_class c, aclexplode(c.relacl) a where c.oid = '${PUB}'::regclass and a.grantee = 0)::int t,
      (select count(*) from pg_proc p, aclexplode(p.proacl) a where p.oid = '${FN}'::regprocedure and a.grantee = 0)::int f`);
  record(s, 'PUBLIC has no grant on table or function', pub.t === 0 && pub.f === 0);
  for (const role of ['anon', 'authenticated']) {
    for (const p of ['select', 'insert', 'update', 'delete', 'truncate']) {
      const r = await one(db, `select has_table_privilege('${role}', '${PUB}', '${p}') v`);
      record(s, `${role} lacks ${p} on publication_events`, r.v === false);
    }
    const r = await one(db, `select has_function_privilege('${role}', '${FN}', 'execute') v`);
    record(s, `${role} cannot execute cms_set_published`, r.v === false);
  }
  const grants = await db.query(`select has_table_privilege('service_role', '${PUB}', 'select') s, has_table_privilege('service_role', '${PUB}', 'insert') i,
      has_table_privilege('service_role', '${PUB}', 'update') u, has_table_privilege('service_role', '${PUB}', 'delete') d,
      has_function_privilege('service_role', '${FN}', 'execute') x`);
  const g = grants.rows[0];
  record(s, 'service_role has select, insert, execute but not update/delete', g.s && g.i && g.x && !g.u && !g.d);

  // Seed (as service_role).
  await db.exec('set role service_role');
  const active = (await one(db, `insert into admin_staff_accounts (email, auth_user_id) values ('active@example.org', gen_random_uuid()) returning actor_id`)).actor_id;
  const disabled = (await one(db, `insert into admin_staff_accounts (email, auth_user_id, status) values ('off@example.org', gen_random_uuid(), 'disabled') returning actor_id`)).actor_id;
  const ann = (await one(db, `insert into announcements (title, body) values ('Test announcement', 'body') returning id`)).id;
  const call = (type, id, publish, actor) => one(db, 'select public.cms_set_published($1, $2, $3, $4) as ts', [type, id, publish, actor]);
  const events = async () => (await db.query(`select entity_type, entity_id, action, actor_id, occurred_at from ${PUB} order by id`)).rows;
  const anonSees = async () => {
    await db.exec('set role anon');
    try { return (await one(db, `select count(*)::int n from announcements where id = '${ann}'`)).n; }
    finally { await db.exec('reset role'); await db.exec('set role service_role'); }
  };

  record(s, 'draft is invisible to anon', (await anonSees()) === 0);

  // Publish.
  const r1 = await call('announcement', ann, true, active);
  const ev1 = await events();
  const row1 = await one(db, `select published_at from announcements where id = '${ann}'`);
  record(s, 'publish returns published_at and sets it', r1.ts !== null && row1.published_at !== null && new Date(r1.ts).getTime() === new Date(row1.published_at).getTime());
  record(s, 'anon now sees the announcement', (await anonSees()) === 1);
  record(s, 'exactly one publish event with the actor id', ev1.length === 1 && ev1[0].action === 'publish'
    && ev1[0].actor_id === active && ev1[0].entity_type === 'announcement' && ev1[0].entity_id === ann);

  // Re-publish: no change.
  const r2 = await call('announcement', ann, true, active);
  const ev2 = await events();
  record(s, 're-publish keeps the same published_at', new Date(r2.ts).getTime() === new Date(r1.ts).getTime());
  record(s, 're-publish adds no event', ev2.length === 1);

  // Unpublish.
  const r3 = await call('announcement', ann, false, active);
  const ev3 = await events();
  const row3 = await one(db, `select published_at from announcements where id = '${ann}'`);
  record(s, 'unpublish returns null and clears published_at', r3.ts === null && row3.published_at === null);
  record(s, 'anon can no longer see it', (await anonSees()) === 0);
  record(s, 'unpublish event recorded with the actor id', ev3.length === 2 && ev3[1].action === 'unpublish' && ev3[1].actor_id === active);
  const r3b = await call('announcement', ann, false, active);
  record(s, 'unpublishing a draft is a no-op (no event)', r3b.ts === null && (await events()).length === 2);

  // Disabled / unknown actor.
  await call('announcement', ann, true, active); // published again: event 3
  const before = { rows: await events(), pub: (await one(db, `select published_at from announcements where id = '${ann}'`)).published_at };
  await expectError(db, s, 'disabled actor gets 42501 (publish)', 'select public.cms_set_published($1, $2, $3, $4)', '42501', ['announcement', ann, true, disabled]);
  await db.exec('set role service_role');
  await expectError(db, s, 'disabled actor gets 42501 (unpublish)', 'select public.cms_set_published($1, $2, $3, $4)', '42501', ['announcement', ann, false, disabled]);
  await db.exec('set role service_role');
  await expectError(db, s, 'unknown actor gets 42501', 'select public.cms_set_published($1, $2, $3, $4)', '42501',
    ['announcement', ann, true, '00000000-0000-4000-8000-000000000000']);
  await db.exec('set role service_role');
  await expectError(db, s, 'null actor gets 42501', 'select public.cms_set_published($1, $2, $3, $4)', '42501', ['announcement', ann, true, null]);
  await db.exec('set role service_role');
  const after = { rows: await events(), pub: (await one(db, `select published_at from announcements where id = '${ann}'`)).published_at };
  record(s, 'rejected actors changed nothing', after.rows.length === before.rows.length && String(after.pub) === String(before.pub));
  // Error message text.
  try { await db.query('select public.cms_set_published($1,$2,$3,$4)', ['announcement', ann, true, disabled]); record(s, 'message', false); }
  catch (e) { record(s, '42501 message is "inactive or unknown staff actor"', e.message.includes('inactive or unknown staff actor')); }

  // Bad type / missing row / null publish.
  await expectError(db, s, 'unknown entity_type gets 22023', 'select public.cms_set_published($1, $2, $3, $4)', '22023', ['nonsense', ann, true, active]);
  await db.exec('set role service_role');
  await expectError(db, s, 'table name as entity_type gets 22023', 'select public.cms_set_published($1, $2, $3, $4)', '22023', ['announcements', ann, false, active]);
  await db.exec('set role service_role');
  await expectError(db, s, 'privileged table name (admin_staff_accounts) is unreachable', 'select public.cms_set_published($1, $2, $3, $4)', '22023',
    ['admin_staff_accounts', active, false, active]);
  await db.exec('set role service_role');
  await expectError(db, s, 'SQL-injection-shaped entity_type gets 22023', 'select public.cms_set_published($1, $2, $3, $4)', '22023',
    [`announcement'; drop table public.announcements; --`, ann, true, active]);
  await db.exec('set role service_role');
  await expectError(db, s, 'case/whitespace variants are not accepted', 'select public.cms_set_published($1, $2, $3, $4)', '22023', ['Announcement ', ann, true, active]);
  await db.exec('set role service_role');
  await expectError(db, s, 'null publish flag gets 22023', 'select public.cms_set_published($1, $2, $3, $4)', '22023', ['announcement', ann, null, active]);
  await db.exec('set role service_role');
  await expectError(db, s, 'missing id gets P0002', 'select public.cms_set_published($1, $2, $3, $4)', 'P0002',
    ['announcement', '00000000-0000-4000-8000-000000000000', true, active]);
  await db.exec('set role service_role');
  await expectError(db, s, 'null id gets P0002', 'select public.cms_set_published($1, $2, $3, $4)', 'P0002', ['announcement', null, true, active]);
  await db.exec('set role service_role');
  const still = await one(db, `select count(*)::int n from public.announcements`);
  record(s, 'announcements table still intact after bad calls', still.n === 1);
  record(s, 'bad calls logged no events', (await events()).length === 3);

  // Every whitelisted type resolves to a real table (missing-row error proves the table exists).
  const ZERO = '00000000-0000-4000-8000-000000000000';
  for (const t of ['sermon_series', 'sermon', 'recurring_event', 'one_time_event', 'group', 'ministry', 'announcement', 'landing_page', 'outreach']) {
    await expectError(db, s, `type ${t} maps to an existing table (P0002 on missing id)`, 'select public.cms_set_published($1, $2, $3, $4)', 'P0002', [t, ZERO, true, active]);
    await db.exec('set role service_role');
  }

  // Table CHECKs and FK.
  await expectError(db, s, 'table CHECK rejects bad entity_type', `insert into ${PUB} (entity_type, entity_id, action, actor_id) values ('speaker', '${ann}', 'publish', '${active}')`, '23514');
  await db.exec('set role service_role');
  await expectError(db, s, 'table CHECK rejects bad action', `insert into ${PUB} (entity_type, entity_id, action, actor_id) values ('announcement', '${ann}', 'delete', '${active}')`, '23514');
  await db.exec('set role service_role');
  await expectError(db, s, 'FK rejects an unknown actor', `insert into ${PUB} (entity_type, entity_id, action, actor_id) values ('announcement', '${ann}', 'publish', '${ZERO}')`, '23503');
  await db.exec('set role service_role');

  // Append-only.
  await expectError(db, s, 'service_role cannot update publication_events (no privilege)', `update ${PUB} set action = 'publish'`, '42501');
  await db.exec('set role service_role');
  await expectError(db, s, 'service_role cannot delete publication_events (no privilege)', `delete from ${PUB}`, '42501');
  await db.exec('reset role');
  await expectError(db, s, 'trigger blocks UPDATE even for the owner', `update ${PUB} set action = 'publish'`, 'P0001');
  await expectError(db, s, 'trigger blocks DELETE even for the owner', `delete from ${PUB}`, 'P0001');
  await expectError(db, s, 'trigger blocks TRUNCATE even for the owner', `truncate ${PUB}`, 'P0001');
  record(s, 'events intact after blocked tampering', (await one(db, `select count(*)::int n from ${PUB}`)).n === 3);

  // anon / authenticated denial.
  for (const role of ['anon', 'authenticated']) {
    await expectError(db, s, `${role} select denied on publication_events`, `set role ${role}; select * from ${PUB}; reset role;`, '42501');
    await expectError(db, s, `${role} insert denied on publication_events`,
      `set role ${role}; insert into ${PUB} (entity_type, entity_id, action, actor_id) values ('announcement', '${ann}', 'publish', '${active}'); reset role;`, '42501');
    await expectError(db, s, `${role} cannot execute cms_set_published`,
      `set role ${role}; select public.cms_set_published('announcement', '${ann}', true, '${active}'); reset role;`, '42501');
  }
  record(s, 'anon/authenticated attempts changed nothing', (await events()).length === 3);

  // Without BYPASSRLS even a granted role is blocked (service_role relies on bypassrls).
  await db.exec('reset role');
  await db.exec(`create role rls_probe nologin noinherit; grant usage on schema public to rls_probe;
    grant select, insert on ${PUB} to rls_probe; grant select on public.admin_staff_accounts to rls_probe;`);
  await db.exec('set role rls_probe');
  const probe = await one(db, `select count(*)::int n from ${PUB}`);
  await db.exec('reset role');
  record(s, 'control: granted role without bypassrls sees no rows (RLS, no policies)', probe.n === 0, `${probe.n} rows visible`);
  await db.exec('reset role');
  await db.exec(`revoke all on ${PUB} from rls_probe; revoke all on public.admin_staff_accounts from rls_probe;`);
  await db.exec('drop owned by rls_probe; drop role rls_probe;');
}

// R2b: published_at changes only through cms_set_published (trigger + transaction-local mark).
const GUARDED = ['sermon_series', 'sermons', 'recurring_events', 'one_time_events', 'groups',
  'ministries', 'announcements', 'landing_pages', 'outreach'];
const GUARD_FN = 'public.published_at_guard()';

async function assertGuard(db, s) {
  await db.exec('reset role');
  // Structure.
  for (const t of GUARDED) {
    const r = await one(db, `select pg_get_triggerdef(oid) d from pg_trigger
      where tgrelid = 'public.${t}'::regclass and tgname = 'published_at_guard' and not tgisinternal`);
    record(s, `guard trigger on ${t} is BEFORE UPDATE OF published_at FOR EACH ROW`,
      !!r && /BEFORE UPDATE OF published_at ON public\.\S+ FOR EACH ROW EXECUTE FUNCTION published_at_guard\(\)/.test(r.d), r?.d ?? 'missing');
  }
  const n = await one(db, `select count(*)::int n from pg_trigger where tgname = 'published_at_guard' and not tgisinternal`);
  record(s, 'guard trigger exists on exactly the 9 publishable tables', n.n === GUARDED.length, `${n.n}`);
  const gf = await one(db, `select prosecdef, proconfig from pg_proc where oid = '${GUARD_FN}'::regprocedure`);
  record(s, 'published_at_guard is security invoker with empty search_path',
    gf.prosecdef === false && JSON.stringify(gf.proconfig) === JSON.stringify(['search_path=""']));
  const gp = await one(db, `select count(*)::int n from pg_proc p, aclexplode(p.proacl) a where p.oid = '${GUARD_FN}'::regprocedure and a.grantee = 0`);
  record(s, 'PUBLIC has no grant on published_at_guard', gp.n === 0);
  for (const role of ['anon', 'authenticated']) {
    const r = await one(db, `select has_function_privilege('${role}', '${GUARD_FN}', 'execute') v`);
    record(s, `${role} cannot execute published_at_guard`, r.v === false);
  }

  // Seed drafts as service_role (INSERT is not guarded in R2b).
  await db.exec('set role service_role');
  const actor = (await one(db, `insert into admin_staff_accounts (email, auth_user_id) values ('guard@example.org', gen_random_uuid()) returning actor_id`)).actor_id;
  const ann = (await one(db, `insert into announcements (title, body) values ('Guard announcement', 'body') returning id`)).id;
  const grp = (await one(db, `insert into groups (slug, name) values ('guard-group', 'Guard group') returning id`)).id;
  const ser = (await one(db, `insert into sermon_series (slug, title) values ('guard-series', 'Guard series') returning id`)).id;
  const call = (type, id, publish) => one(db, 'select public.cms_set_published($1, $2, $3, $4) as ts', [type, id, publish, actor]);
  const pubAt = async (t, id) => (await one(db, `select published_at from public.${t} where id = $1`, [id])).published_at;
  const evCount = async () => (await one(db, `select count(*)::int n from ${PUB} where actor_id = $1`, [actor])).n;
  const asService = () => db.exec('set role service_role');

  await expectError(db, s, 'service_role direct publish of a draft (published_at = now()) raises P0001',
    `update public.announcements set published_at = now() where id = '${ann}'`, 'P0001');
  await asService();
  try { await db.exec(`update public.announcements set published_at = now() where id = '${ann}'`); record(s, 'guard message', false); }
  catch (e) { record(s, 'guard message is "published_at changes only through cms_set_published"', e.message.includes('published_at changes only through cms_set_published')); }
  record(s, 'blocked direct publish left the draft unpublished', (await pubAt('announcements', ann)) === null);

  // cms_set_published still publishes and records the event.
  const r1 = await call('announcement', ann, true);
  record(s, 'cms_set_published still publishes under the guard', r1.ts !== null && (await pubAt('announcements', ann)) !== null);
  record(s, 'publish under the guard recorded one event', (await evCount()) === 1);
  const mark = await one(db, `select coalesce(current_setting('thrive.cms_set_published', true), '') v`);
  record(s, 'mark is not left on after cms_set_published returns', mark.v !== 'on', `'${mark.v}'`);

  await expectError(db, s, 'service_role direct unpublish (published_at = null) raises P0001',
    `update public.announcements set published_at = null where id = '${ann}'`, 'P0001');
  await asService();
  await expectError(db, s, 'service_role direct re-date of a published row raises P0001',
    `update public.announcements set published_at = published_at - interval '1 day' where id = '${ann}'`, 'P0001');
  await asService();
  await expectError(db, s, 'service_role bulk direct update without WHERE raises P0001',
    `update public.announcements set published_at = now()`, 'P0001');
  await asService();
  const keep = await pubAt('announcements', ann);
  record(s, 'blocked direct changes left published_at intact', keep !== null && new Date(keep).getTime() === new Date(r1.ts).getTime());

  // Unchanged published_at passes.
  try {
    await db.exec(`update public.announcements set title = 'Guard announcement (edited)' where id = '${ann}'`);
    await db.exec(`update public.announcements set title = 'Guard announcement', published_at = published_at where id = '${ann}'`);
    const after = await pubAt('announcements', ann);
    record(s, 'content edits and same-value published_at writes pass', new Date(after).getTime() === new Date(r1.ts).getTime());
  } catch (e) { await asService().catch(() => {}); record(s, 'content edits and same-value published_at writes pass', false, e.message.split('\n')[0]); }

  // Seed-shaped upsert: same timestamp passes, a different one raises.
  const g1 = await call('group', grp, true);
  const gTs = new Date(g1.ts).toISOString();
  try {
    await db.query(`insert into public.groups (slug, name, published_at) values ('guard-group', 'Guard group', $1)
      on conflict (slug) do update set name = excluded.name, published_at = excluded.published_at`, [gTs]);
    record(s, 'seed-style upsert re-writing the same published_at passes', new Date(await pubAt('groups', grp)).getTime() === new Date(g1.ts).getTime());
  } catch (e) { await asService().catch(() => {}); record(s, 'seed-style upsert re-writing the same published_at passes', false, e.message.split('\n')[0]); }
  await expectError(db, s, 'seed-style upsert with a different published_at raises P0001',
    `insert into public.groups (slug, name, published_at) values ('guard-group', 'Guard group', now() + interval '1 hour')
      on conflict (slug) do update set published_at = excluded.published_at`, 'P0001');
  await asService();

  // No leak: inside one transaction, a direct change after cms_set_published still raises.
  for (const [type, table, id] of [['announcement', 'announcements', ann], ['group', 'groups', grp], ['sermon_series', 'sermon_series', ser]]) {
    const item = `no mark leak: direct ${table} change after cms_set_published in the same transaction raises P0001`;
    await db.exec('begin');
    try {
      const target = (await pubAt(table, id)) === null;
      await call(type, id, target);
      await db.exec(`update public.${table} set published_at = ${target ? 'null' : 'now()'} where id = '${id}'`);
      record(s, item, false, 'no error raised');
    } catch (e) {
      record(s, item, e.code === 'P0001', `${e.code} ${e.message.split('\n')[0]}`);
    } finally {
      await db.exec('rollback');
      await asService();
    }
  }
  record(s, 'rolled-back transactions left no events', (await evCount()) === 2);

  // Owner is guarded too (trigger, not privileges).
  await db.exec('reset role');
  await expectError(db, s, 'owner direct change also raises P0001',
    `update public.sermon_series set published_at = now() where id = '${ser}'`, 'P0001');
  await asService();

  // Unpublish through the function still works on the guarded tables.
  const u1 = await call('announcement', ann, false);
  const u2 = await call('group', grp, false);
  const s1 = await call('sermon_series', ser, true);
  record(s, 'cms_set_published still unpublishes and publishes under the guard',
    u1.ts === null && u2.ts === null && s1.ts !== null
    && (await pubAt('announcements', ann)) === null && (await pubAt('groups', grp)) === null && (await pubAt('sermon_series', ser)) !== null);
  record(s, 'each function change recorded exactly one event', (await evCount()) === 5);
  await db.exec('reset role');
}

async function main() {
  console.log(`# ${(await (await PGlite.create()).query('select version() v')).rows[0].v}\n`);

  const A = 'A fresh schema.sql';
  const a = await freshDb();
  await apply(a, A, 'schema.sql', schemaSql);
  const freshSnap = await snapshot(a);
  for (const pass of [1, 2]) for (const m of migrations) await apply(a, A, `${m.name} (chain pass ${pass})`, m.sql);
  compare(A, freshSnap, await snapshot(a), 'schema.sql before migrations (chain is a no-op)');
  await assertPublishing(a, A);
  await assertGuard(a, A);

  for (const [label, june] of [['B June schema', juneFull], ['C June schema without patch', juneNoPatch]]) {
    const db = await freshDb();
    await apply(db, label, 'june schema.sql', june);
    for (const m of migrations) {
      await apply(db, label, `${m.name} (run 1)`, m.sql);
      await apply(db, label, `${m.name} (run 2)`, m.sql);
    }
    compare(label, freshSnap, await snapshot(db), 'fresh schema.sql');
    await assertPublishing(db, label);
    await assertGuard(db, label);
  }

  console.log(`\n${total - failures}/${total} checks passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
