// #60 rehearsal: run supabase/schema.sql and supabase/migrations/*.sql on a real,
// multi-connection Postgres 17 (embedded-postgres, a disposable local cluster) and
// check grants, RLS, idempotent re-application and concurrent take_rate_limit.
// Usage (from this directory): npm ci && node rehearse-pg.mjs [repo-root]
//   exit 0 = all checks pass, 1 = a check failed, 2 = crash.
// The June baseline schema comes from this checkout's git history (commit cd012bd).
// No docker, no psql, no network database: the cluster lives in a temp dir and is
// stopped and deleted in `finally`.
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

process.on('uncaughtException', (e) => { console.error(e); process.exit(2); });
const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(process.argv[2] ?? join(here, '../..'));
const read = (p) => readFileSync(p, 'utf8');
const JUNE_SCHEMA_COMMIT = 'cd012bd';
const schemaSql = read(join(repo, 'supabase/schema.sql'));
const migDir = join(repo, 'supabase/migrations');
const migrations = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()
  .map((f) => ({ name: `migrations/${f}`, sql: read(join(migDir, f)) }));
const juneFull = execFileSync('git', ['-C', here, 'show', `${JUNE_SCHEMA_COMMIT}:supabase/schema.sql`], { encoding: 'utf8' });
// June file without its "SCHEMA PATCH: Sprint 01" block (starts at line 305).
const juneNoPatch = juneFull.split('\n').slice(0, 304).join('\n');

const results = [];
let failures = 0;
const record = (scenario, item, ok, detail = '') => {
  results.push({ scenario, item, ok, detail });
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${scenario}] ${item}${detail ? `  (${detail})` : ''}`);
};

const PASSWORD = 'rehearsal';
const PORT = 20000 + Math.floor(Math.random() * 30000);
const USER = 'postgres';
const CONCURRENT_CALLERS = 50;
const BARRIER_KEY = 777;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = (c) => c.repeat(64);

// Supabase-like roles. Roles are cluster-wide, so they are created once and
// guarded. service_role has BYPASSRLS on Supabase; anon and authenticated do not.
const CLUSTER_ROLES = `
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
    if not exists (select 1 from pg_roles where rolname = 'rls_probe') then create role rls_probe nologin noinherit; end if; -- grants but no bypassrls (control)
  end $$;
`;
// Per-database part: Supabase-style default privileges grant everything new in
// public to all three API roles, so the migrations' revokes are actually tested.
const DB_STUBS = `
  grant usage on schema public to anon, authenticated, service_role, rls_probe;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

const open = []; // every client we open, so `finally` can close them all
async function connect(database, role) {
  const c = new pg.Client({ host: '127.0.0.1', port: PORT, user: USER, password: PASSWORD, database });
  c.on('error', () => {});
  await c.connect();
  open.push(c);
  if (role) await c.query(`set role ${role}`);
  return c;
}
const close = async (c) => { await c.end().catch(() => {}); };

const one = async (db, sql, params) => (await db.query(sql, params)).rows[0];
const take = (db, purpose, hash, limit, win) =>
  one(db, 'select * from public.take_rate_limit($1, $2, $3, $4)', [purpose, hash, limit, win]);

async function apply(db, scenario, name, sql, { expectFail } = {}) {
  try {
    await db.query(sql);
    record(scenario, `apply ${name}`, !expectFail, expectFail ? `expected failure: ${expectFail}` : '');
  } catch (e) {
    await db.query('rollback').catch(() => {});
    const msg = e.message.split('\n')[0];
    if (expectFail && msg.includes(expectFail)) record(scenario, `apply ${name} (expected failure)`, true, msg);
    else record(scenario, `apply ${name}`, false, msg);
  }
}

// Runs sql on a fresh connection that SET ROLEs to `role` (or stays superuser) and expects an error code.
async function expectError(dbName, scenario, item, sql, code, role) {
  const c = await connect(dbName, role);
  try {
    await c.query(sql);
    record(scenario, item, false, 'no error raised');
  } catch (e) {
    record(scenario, item, [code].flat().includes(e.code), `${e.code} ${e.message.split('\n')[0]}`);
  } finally {
    await close(c);
  }
}

// Catalog snapshot of the public schema, for fresh-vs-migrated comparison.
async function snapshot(db) {
  const q = async (sql) => (await db.query(sql)).rows.map((r) => JSON.stringify(r)).sort();
  return {
    columns: await q(`select table_name, column_name, data_type, column_default, is_nullable
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
    triggers: await q(`select tgrelid::regclass::text t, tgname, pg_get_triggerdef(oid) d from pg_trigger
                       where not tgisinternal`),
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

async function assertRoles(db, s) {
  const r = await db.query(`select rolname, rolbypassrls, rolsuper from pg_roles where rolname in ('anon','authenticated','service_role')`);
  const by = Object.fromEntries(r.rows.map((x) => [x.rolname, x]));
  record(s, 'stub roles: only service_role has BYPASSRLS, none is superuser',
    by.service_role?.rolbypassrls === true && by.anon?.rolbypassrls === false && by.authenticated?.rolbypassrls === false
    && r.rows.every((x) => x.rolsuper === false));
}

async function assertLimiter(db, dbName, s) {
  const T = 'public.rate_limit_buckets';
  const TAKE = 'public.take_rate_limit(text,text,integer,integer)';
  const PRUNE = 'public.prune_rate_limit_buckets(integer)';

  // RLS on, no policies.
  const rls = await one(db, `select relrowsecurity from pg_class where oid = '${T}'::regclass`);
  record(s, 'RLS enabled on rate_limit_buckets', rls.relrowsecurity === true);
  const pol = await one(db, `select count(*)::int n from pg_policies where schemaname='public' and tablename='rate_limit_buckets'`);
  record(s, 'no policies on rate_limit_buckets', pol.n === 0, `${pol.n} policies`);
  for (const f of [TAKE, PRUNE]) {
    const fn = await one(db, `select prosecdef, proconfig from pg_proc where oid = '${f}'::regprocedure`);
    record(s, `${f.split('(')[0]} is security invoker with empty search_path`,
      fn.prosecdef === false && JSON.stringify(fn.proconfig) === JSON.stringify(['search_path=""']), JSON.stringify(fn.proconfig));
  }

  // Privileges: catalog view.
  for (const role of ['anon', 'authenticated']) {
    for (const p of ['select', 'insert', 'update', 'delete', 'truncate', 'references', 'trigger']) {
      const r = await one(db, `select has_table_privilege('${role}', '${T}', '${p}') v`);
      record(s, `${role} lacks ${p} on table`, r.v === false);
    }
    for (const f of [TAKE, PRUNE]) {
      const r = await one(db, `select has_function_privilege('${role}', '${f}', 'execute') v`);
      record(s, `${role} cannot execute ${f.split('(')[0]}`, r.v === false);
    }
  }
  for (const p of ['select', 'insert', 'update', 'delete']) {
    const r = await one(db, `select has_table_privilege('service_role', '${T}', '${p}') v`);
    record(s, `service_role has ${p} on table`, r.v === true);
  }
  for (const f of [TAKE, PRUNE]) {
    const r = await one(db, `select has_function_privilege('service_role', '${f}', 'execute') v`);
    record(s, `service_role can execute ${f.split('(')[0]}`, r.v === true);
  }
  const pub = await one(db, `select
      (select count(*) from pg_class c, aclexplode(c.relacl) a where c.oid = '${T}'::regclass and a.grantee = 0)::int t,
      (select count(*) from pg_proc p, aclexplode(p.proacl) a where p.oid in ('${TAKE}'::regprocedure, '${PRUNE}'::regprocedure) and a.grantee = 0)::int f`);
  record(s, 'PUBLIC has no grant on table or functions', pub.t === 0 && pub.f === 0, `table ${pub.t}, functions ${pub.f}`);

  // Privileges: behaviour, on separate connections that SET ROLE.
  for (const role of ['anon', 'authenticated']) {
    const x = (item, sql) => expectError(dbName, s, `${role} ${item} denied`, sql, '42501', role);
    await x('select', `select * from ${T}`);
    await x('insert', `insert into ${T} values ('x.y', 60, '${H('a')}', now(), now() + interval '1 minute', 1)`);
    await x('update', `update ${T} set hits = 1`);
    await x('delete', `delete from ${T}`);
    await x('take_rate_limit', `select * from public.take_rate_limit('x.y', '${H('a')}', 1, 60)`);
    await x('prune', `select public.prune_rate_limit_buckets(10)`);
  }
  const svc = await connect(dbName, 'service_role');
  try {
    const r = await take(svc, 'svc.check', H('b'), 5, 60);
    record(s, 'service_role can call take_rate_limit', r.allowed === true);
    const sel = await one(svc, `select count(*)::int n from ${T} where purpose = 'svc.check'`);
    record(s, 'service_role can select (sees its row through RLS)', sel.n === 1);
    await svc.query(`update ${T} set hits = 2 where purpose = 'svc.check'`);
    await svc.query(`insert into ${T} values ('svc.ins', 60, '${H('c')}', now(), now() + interval '1 minute', 1)`);
    await svc.query(`delete from ${T} where purpose in ('svc.check', 'svc.ins')`);
    record(s, 'service_role can insert/update/delete', true);
    const pr = await one(svc, 'select public.prune_rate_limit_buckets(10) n');
    record(s, 'service_role can call prune', typeof pr.n === 'number');
  } catch (e) {
    record(s, 'service_role usage', false, e.message);
  } finally {
    await close(svc);
  }
  // Control: same grants without BYPASSRLS, so RLS (no policies) blocks the write.
  await db.query(`grant select, insert, update, delete on ${T} to rls_probe; grant execute on function ${TAKE} to rls_probe;`);
  await expectError(dbName, s, 'control: granted role WITHOUT bypassrls is blocked by RLS (service_role relies on BYPASSRLS)',
    `select * from public.take_rate_limit('probe.x', '${H('d')}', 1, 60)`, '42501', 'rls_probe');
  await db.query(`revoke all on ${T} from rls_probe; revoke execute on function ${TAKE} from rls_probe;`);

  // CHECK constraints on direct writes (superuser, so only the constraints can refuse).
  const ins = (purpose, hash) => `insert into ${T} values ('${purpose}', 60, '${hash}', now(), now() + interval '1 minute', 1)`;
  const badHashes = { '63 hex': 'a'.repeat(63), '65 hex': 'a'.repeat(65), uppercase: 'A'.repeat(64), 'non-hex': 'g'.repeat(64),
    'raw email': 'person@example.org', empty: '', 'trailing newline': 'a'.repeat(64) + '\n' };
  for (const [label, h] of Object.entries(badHashes)) {
    await expectError(dbName, s, `table CHECK rejects subject_hash: ${label}`, ins('chk.x', h), '23514');
  }
  await expectError(dbName, s, 'table CHECK rejects bad purpose', ins('Bad Purpose', H('a')), '23514');
  await expectError(dbName, s, 'table CHECK rejects window 0', `insert into ${T} values ('chk.x', 0, '${H('a')}', now(), now() + interval '1 minute', 1)`, '23514');
  await expectError(dbName, s, 'table CHECK rejects hits 0', `insert into ${T} values ('chk.x', 60, '${H('a')}', now(), now() + interval '1 minute', 0)`, '23514');
  await expectError(dbName, s, 'table CHECK rejects expires_at <= window_start', `insert into ${T} values ('chk.x', 60, '${H('a')}', now(), now(), 1)`, '23514');
  await db.query(ins('chk.ok', H('e')));
  record(s, 'table accepts valid 64-char lowercase hex', true);
  await db.query(`delete from ${T}`);

  // Invalid function arguments raise 22023 (called as service_role).
  const bad = [
    ['purpose null', 'null', `'${H('a')}'`, '1', '60'], ['purpose uppercase', `'Bad'`, `'${H('a')}'`, '1', '60'],
    ['purpose empty', `''`, `'${H('a')}'`, '1', '60'], ['purpose 65 chars', `'${'a'.repeat(65)}'`, `'${H('a')}'`, '1', '60'],
    ['hash null', `'p.x'`, 'null', '1', '60'], ['hash 63', `'p.x'`, `'${'a'.repeat(63)}'`, '1', '60'],
    ['hash uppercase', `'p.x'`, `'${H('A')}'`, '1', '60'], ['hash raw email', `'p.x'`, `'a@b.org'`, '1', '60'],
    ['limit 0', `'p.x'`, `'${H('a')}'`, '0', '60'], ['limit 100001', `'p.x'`, `'${H('a')}'`, '100001', '60'],
    ['limit null', `'p.x'`, `'${H('a')}'`, 'null', '60'], ['window 0', `'p.x'`, `'${H('a')}'`, '1', '0'],
    ['window 86401', `'p.x'`, `'${H('a')}'`, '1', '86401'], ['window null', `'p.x'`, `'${H('a')}'`, '1', 'null'],
  ];
  for (const [label, p, h, l, w] of bad) {
    await expectError(dbName, s, `take_rate_limit rejects ${label}`, `select * from public.take_rate_limit(${p}, ${h}, ${l}::int, ${w}::int)`, '22023', 'service_role');
  }
  for (const v of ['0', '10001', 'null']) {
    await expectError(dbName, s, `prune rejects bound ${v}`, `select public.prune_rate_limit_buckets(${v}::int)`, '22023', 'service_role');
  }
  const cnt = await one(db, `select count(*)::int n from ${T}`);
  record(s, 'rejected calls wrote no rows', cnt.n === 0);

  // Counting: first hit, boundary, over limit, cap, retry value. Run as service_role.
  const sv = await connect(dbName, 'service_role');
  try {
    const seq = [];
    for (let i = 0; i < 5; i++) seq.push(await take(sv, 'cnt.a', H('1'), 3, 60));
    const row = await one(db, `select hits, window_start, expires_at, extract(epoch from expires_at - clock_timestamp())::float8 left_s
                               from ${T} where purpose = 'cnt.a'`);
    record(s, 'first hit allowed, retry 0', seq[0].allowed === true && seq[0].retry_after_seconds === 0);
    record(s, 'hits 2..limit allowed', seq[1].allowed && seq[2].allowed && seq[2].retry_after_seconds === 0);
    record(s, 'limit+1 denied', seq[3].allowed === false);
    record(s, 'further hits denied', seq[4].allowed === false);
    const retry = seq[3].retry_after_seconds;
    record(s, 'retry_after in [1, window] and = ceil(seconds to window end)',
      retry >= 1 && retry <= 60 && Math.abs(retry - Math.ceil(row.left_s)) <= 1, `retry ${retry}, left ${row.left_s.toFixed(2)}s`);
    record(s, 'hits capped at limit+1', row.hits === 4, `hits ${row.hits}`);
    const ws = new Date(row.window_start).getTime();
    record(s, 'window_start aligned to window and expires = start + window',
      ws % 60000 === 0 && new Date(row.expires_at).getTime() - ws === 60000);

    const l1 = [await take(sv, 'cnt.one', H('2'), 1, 60), await take(sv, 'cnt.one', H('2'), 1, 60)];
    record(s, 'limit 1: first allowed, second denied', l1[0].allowed && !l1[1].allowed);

    const iso1 = await take(sv, 'cnt.b', H('1'), 3, 60);
    record(s, 'purpose isolation: same subject under another purpose starts fresh', iso1.allowed === true);
    const iso2 = await take(sv, 'cnt.a', H('9'), 3, 60);
    record(s, 'subject isolation: another subject under same purpose starts fresh', iso2.allowed === true);
    const iso3 = await take(sv, 'cnt.a', H('1'), 3, 120);
    record(s, 'window isolation: same purpose+subject with another window length is a separate bucket', iso3.allowed === true);
    const n = await one(db, `select count(*)::int n from ${T} where subject_hash = '${H('1')}'`);
    record(s, 'separate rows per (purpose, window, subject)', n.n === 3, `${n.n} rows`);
    const still = await take(sv, 'cnt.a', H('1'), 3, 60);
    record(s, 'original bucket still denied after isolation calls', still.allowed === false);

    // Window expiry, simulated: move the denied bucket into the past (superuser).
    await db.query(`update ${T} set window_start = window_start - interval '1 hour', expires_at = expires_at - interval '1 hour'
                    where purpose = 'cnt.a' and window_seconds = 60 and subject_hash = '${H('1')}'`);
    const after = await take(sv, 'cnt.a', H('1'), 3, 60);
    const row2 = await one(db, `select hits, expires_at > clock_timestamp() live from ${T} where purpose='cnt.a' and window_seconds=60 and subject_hash='${H('1')}'`);
    record(s, 'expired window (simulated): next hit allowed and counter resets to 1', after.allowed && row2.hits === 1 && row2.live);

    // Window expiry, real clock: 1-second window, wait for the boundary.
    const msToBoundary = 1000 - (Date.now() % 1000);
    if (msToBoundary < 300) await sleep(msToBoundary + 20);
    const r1 = [await take(sv, 'cnt.real', H('3'), 1, 1), await take(sv, 'cnt.real', H('3'), 1, 1)];
    await sleep(1100);
    const r2 = await take(sv, 'cnt.real', H('3'), 1, 1);
    record(s, 'real 1s window: allowed, denied (retry 1), allowed after boundary',
      r1[0].allowed && !r1[1].allowed && r1[1].retry_after_seconds === 1 && r2.allowed);
  } catch (e) {
    record(s, 'counting scenarios', false, e.message);
  } finally {
    await close(sv);
  }

  // Cleanup removes only expired rows.
  await db.query(`delete from ${T}`);
  await db.query(`insert into ${T}
    select 'gc.old', 60, lpad(to_hex(g), 64, '0'), now() - interval '2 hours', now() - interval '1 hour', 1 from generate_series(1, 30) g;
    insert into ${T}
    select 'gc.live', 60, lpad(to_hex(g), 64, '0'), now(), now() + interval '1 hour', 1 from generate_series(1, 10) g;`);
  const gc = await connect(dbName, 'service_role');
  await take(gc, 'gc.caller', H('4'), 5, 60);
  let c = await one(db, `select count(*) filter (where purpose = 'gc.old')::int old, count(*) filter (where purpose = 'gc.live')::int live,
                         count(*) filter (where purpose = 'gc.caller')::int caller from ${T}`);
  record(s, 'take_rate_limit inline cleanup deletes at most 25 expired rows', c.old === 5, `${c.old} expired left`);
  record(s, 'inline cleanup keeps live rows and the caller row', c.live === 10 && c.caller === 1);
  const pr1 = await one(gc, 'select public.prune_rate_limit_buckets(3) n');
  const pr2 = await one(gc, 'select public.prune_rate_limit_buckets() n');
  const pr3 = await one(gc, 'select public.prune_rate_limit_buckets() n');
  await close(gc);
  c = await one(db, `select count(*) filter (where purpose = 'gc.old')::int old, count(*) filter (where purpose <> 'gc.old')::int other from ${T}`);
  record(s, 'prune honours its bound and returns the count', pr1.n === 3 && pr2.n === 2 && pr3.n === 0, `${pr1.n}, ${pr2.n}, ${pr3.n}`);
  record(s, 'prune removes only expired rows', c.old === 0 && c.other === 11, `${c.other} live left`);
  await db.query(`delete from ${T}`);
}

// D1R staff table (QA S6): rows survive delete and truncate, and service_role
// has only select/insert/update even though default privileges grant it all.
async function assertStaff(db, dbName, s) {
  const T = 'public.admin_staff_accounts';
  const rls = await one(db, `select relrowsecurity from pg_class where oid = '${T}'::regclass`);
  const pol = await one(db, `select count(*)::int n from pg_policies where schemaname='public' and tablename='admin_staff_accounts'`);
  record(s, 'RLS enabled on admin_staff_accounts, no policies', rls.relrowsecurity === true && pol.n === 0, `${pol.n} policies`);
  for (const p of ['select', 'insert', 'update']) {
    const r = await one(db, `select has_table_privilege('service_role', '${T}', '${p}') v`);
    record(s, `service_role has ${p} on staff table`, r.v === true);
  }
  for (const p of ['delete', 'truncate', 'references', 'trigger']) {
    const r = await one(db, `select has_table_privilege('service_role', '${T}', '${p}') v`);
    record(s, `service_role lacks ${p} on staff table`, r.v === false);
  }
  for (const role of ['anon', 'authenticated']) {
    for (const p of ['select', 'insert', 'update', 'delete', 'truncate']) {
      const r = await one(db, `select has_table_privilege('${role}', '${T}', '${p}') v`);
      record(s, `${role} lacks ${p} on staff table`, r.v === false);
    }
    await expectError(dbName, s, `${role} select on staff table denied`, `select * from ${T}`, '42501', role);
  }
  await db.query(`insert into ${T} (email, auth_user_id) values ('rehearsal@example.org', gen_random_uuid())`);
  const sc = await connect(dbName, 'service_role');
  const sel = await sc.query(`select count(*)::int n from ${T}`).then((r) => r.rows[0].n, () => -1);
  await close(sc);
  record(s, 'service_role can select from staff table', sel === 1, `${sel} rows`);
  await expectError(dbName, s, 'service_role truncate on staff table denied', `truncate ${T}`, '42501', 'service_role');
  await expectError(dbName, s, 'service_role delete on staff table denied', `delete from ${T}`, '42501', 'service_role');
  // Owner (superuser here) bypasses grants, so only the triggers stand in the way.
  await expectError(dbName, s, 'owner truncate on staff table refused', `truncate ${T}`, ['P0001', '0A000']);
  await expectError(dbName, s, 'owner truncate cascade on staff table raised by trigger', `truncate ${T} cascade`, 'P0001');
  await expectError(dbName, s, 'owner delete on staff table raised by trigger', `delete from ${T}`, 'P0001');
  const n = await one(db, `select count(*)::int n from ${T}`);
  record(s, 'staff row survives truncate and delete attempts', n.n === 1, `${n.n} rows`);
}

// ---------------------------------------------------------------------------
// Concurrency.
// ---------------------------------------------------------------------------

// Waits for the next window room so a trial never straddles a 60 s window boundary.
async function windowRoom() {
  const left = 60000 - (Date.now() % 60000);
  if (left < 6000) await sleep(left + 100);
}

// Fires `callers` simultaneous calls of `fn` from separate backends. Each call is
// one statement that first waits on a shared advisory lock; the coordinator holds
// the exclusive lock until every backend is parked on it, then releases it, so
// all calls start together. Returns results plus how many distinct backends were
// really waiting at the barrier.
async function runTrial(dbName, fn, plan, limit, windowSeconds = 60) {
  const clients = await Promise.all(plan.map(() => connect(dbName, 'service_role')));
  const coord = await connect(dbName);
  await coord.query('select pg_advisory_lock($1)', [BARRIER_KEY]);
  const sql = `with gate as (select (pg_advisory_xact_lock_shared(${BARRIER_KEY})::text = '')::int - 1 as z)
               select t.allowed, t.retry_after_seconds from gate g, lateral ${fn}($1, $2, $3, $4 + g.z) t`;
  await windowRoom();
  const calls = plan.map((subject, i) =>
    clients[i].query(sql, [subject.purpose, subject.hash, limit, windowSeconds])
      .then((r) => ({ subject, row: r.rows[0] }), (e) => ({ subject, error: e.message })));
  let waiting = 0;
  for (let i = 0; i < 400 && waiting < plan.length; i++) {
    waiting = (await one(coord, `select count(distinct pid)::int n from pg_locks where locktype = 'advisory' and not granted`)).n;
    if (waiting < plan.length) await sleep(25);
  }
  await coord.query('select pg_advisory_unlock($1)', [BARRIER_KEY]);
  const out = await Promise.all(calls);
  await Promise.all([...clients, coord].map(close));
  return { out, waiting };
}

// Checks one trial. Returns named booleans so the real function records each and
// the mutant just needs one to be false.
async function evaluate(admin, table, { out, waiting }, limit, expectedPerSubject) {
  const errors = out.filter((o) => o.error);
  const subjects = [...new Set(out.map((o) => o.subject.hash))];
  let allowedOk = true, deniedOk = true, retryOk = true, hitsOk = true;
  const notes = [];
  for (const hash of subjects) {
    const mine = out.filter((o) => o.subject.hash === hash && o.row);
    const allowed = mine.filter((o) => o.row.allowed === true);
    const denied = mine.filter((o) => o.row.allowed === false);
    if (allowed.length !== expectedPerSubject.allowed) allowedOk = false;
    if (denied.length !== expectedPerSubject.denied) deniedOk = false;
    if (!denied.every((o) => o.row.retry_after_seconds >= 1 && o.row.retry_after_seconds <= 60)) retryOk = false;
    const b = await one(admin, `select hits from ${table} where purpose = $1 and subject_hash = $2`, [mine[0]?.subject.purpose ?? 'none', hash]);
    if (!b || b.hits !== Math.min(mine.length + expectedPerSubject.preexisting, limit + 1)) hitsOk = false;
    notes.push(`allowed ${allowed.length}/denied ${denied.length}/hits ${b?.hits}`);
  }
  return {
    detail: `${errors.length} errors, ${waiting} backends at barrier; ${notes.slice(0, 2).join('; ')}${notes.length > 2 ? '; ...' : ''}`,
    checks: {
      'no call errored': errors.length === 0,
      'all callers were parked on the barrier from separate backends': waiting === out.length,
      'exactly the limit allowed per subject': allowedOk,
      'every other call denied': deniedOk,
      'denied calls report retry_after_seconds in [1, 60]': retryOk,
      'bucket hits = min(calls, limit + 1)': hitsOk,
    },
  };
}

const repeatPlan = (n, s) => Array.from({ length: n }, () => s);
let trialSeq = 0;
const freshHash = () => (++trialSeq).toString(16).padStart(2, '0').repeat(32);

async function assertConcurrency(admin, dbName, s) {
  const T = 'public.rate_limit_buckets';
  const N = CONCURRENT_CALLERS;
  const TAKE = 'public.take_rate_limit';

  // 5 trials: 50 callers, one brand-new subject, limit 3. Every trial is a first-insert race.
  for (let i = 1; i <= 5; i++) {
    const sj = { purpose: 'conc.test', hash: freshHash() };
    const t = await runTrial(dbName, TAKE, repeatPlan(N, sj), 3);
    const ev = await evaluate(admin, T, t, 3, { allowed: 3, denied: N - 3, preexisting: 0 });
    for (const [item, ok] of Object.entries(ev.checks)) record(s, `concurrency trial ${i} (50 callers, 1 new subject, limit 3): ${item}`, ok, ev.detail);
  }
  // Existing row: the bucket already holds one hit, so only 2 more calls may pass.
  {
    const sj = { purpose: 'conc.test', hash: freshHash() };
    const sv = await connect(dbName, 'service_role');
    await take(sv, sj.purpose, sj.hash, 3, 60);
    await close(sv);
    const t = await runTrial(dbName, TAKE, repeatPlan(N, sj), 3);
    const ev = await evaluate(admin, T, t, 3, { allowed: 2, denied: N - 2, preexisting: 1 });
    for (const [item, ok] of Object.entries(ev.checks)) record(s, `concurrency trial 6 (50 callers, existing bucket with 1 hit, limit 3): ${item}`, ok, ev.detail);
  }
  // Mixed: 50 callers over 5 subjects, limit 2 => 10 allowed, 2 per subject.
  {
    const subs = ['a', 'b', 'c', 'd', 'e'].map(() => ({ purpose: 'conc.mixed', hash: freshHash() }));
    const plan = Array.from({ length: N }, (_, i) => subs[i % 5]);
    const t = await runTrial(dbName, TAKE, plan, 2);
    const ev = await evaluate(admin, T, t, 2, { allowed: 2, denied: 8, preexisting: 0 });
    const total = t.out.filter((o) => o.row?.allowed).length;
    for (const [item, ok] of Object.entries(ev.checks)) record(s, `concurrency mixed trial (50 callers, 5 subjects, limit 2): ${item}`, ok, ev.detail);
    record(s, 'concurrency mixed trial: exactly 10 allowed in total', total === 10, `${total} allowed`);
  }
  // Inline cleanup under contention: 100 expired rows, 50 concurrent callers, no deadlock or error.
  {
    await admin.query(`insert into ${T}
      select 'gc.conc', 60, lpad(to_hex(g), 64, 'f'), now() - interval '2 hours', now() - interval '1 hour', 1 from generate_series(1, 100) g`);
    const plan = Array.from({ length: N }, () => ({ purpose: 'conc.gc', hash: freshHash() }));
    const t = await runTrial(dbName, TAKE, plan, 5);
    const errs = t.out.filter((o) => o.error);
    const left = (await one(admin, `select count(*)::int n from ${T} where purpose = 'gc.conc'`)).n;
    const live = (await one(admin, `select count(*)::int n from ${T} where purpose = 'conc.gc'`)).n;
    record(s, 'concurrency with inline cleanup (50 callers, 100 expired rows): no errors, no deadlock', errs.length === 0, errs[0]?.error ?? 'no errors');
    record(s, 'concurrency with inline cleanup: expired rows pruned, caller rows kept', left < 100 && live === plan.length, `${left} expired left, ${live} live rows`);
    await admin.query(`delete from ${T} where purpose in ('gc.conc', 'conc.gc')`);
  }
}

// Mutation proof: a deliberately non-atomic copy (read, then write the value it read)
// in a scratch schema. If the harness is real it must fail here.
async function mutationProof(admin, dbName, s) {
  await admin.query(`
    create schema mut;
    create table mut.rate_limit_buckets (like public.rate_limit_buckets including all);
    create function mut.take_rate_limit(p_purpose text, p_subject_hash text, p_limit integer, p_window_seconds integer)
    returns table (allowed boolean, retry_after_seconds integer) language plpgsql as $$
    declare v_hits integer; v_start timestamptz; v_expires timestamptz;
    begin
      v_start := to_timestamp(floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds);
      v_expires := v_start + make_interval(secs => p_window_seconds);
      select b.hits into v_hits from mut.rate_limit_buckets b
        where b.purpose = p_purpose and b.window_seconds = p_window_seconds and b.subject_hash = p_subject_hash;
      if v_hits is null then
        insert into mut.rate_limit_buckets values (p_purpose, p_window_seconds, p_subject_hash, v_start, v_expires, 1)
          on conflict do nothing;
        v_hits := 1;
      else
        v_hits := least(v_hits + 1, p_limit + 1);
        update mut.rate_limit_buckets b set hits = v_hits
          where b.purpose = p_purpose and b.window_seconds = p_window_seconds and b.subject_hash = p_subject_hash;
      end if;
      allowed := v_hits <= p_limit;
      retry_after_seconds := case when allowed then 0 else greatest(1, ceil(extract(epoch from (v_expires - clock_timestamp())))::integer) end;
      return next;
    end $$;
    grant usage on schema mut to service_role;
    grant all on table mut.rate_limit_buckets to service_role;
    grant execute on function mut.take_rate_limit(text, text, integer, integer) to service_role;
  `);
  const N = CONCURRENT_CALLERS;
  const TRIALS = 5;
  let detectedNew = 0, detectedExisting = 0;
  const seen = new Set();
  for (let i = 0; i < TRIALS; i++) {
    const sj = { purpose: 'conc.mut', hash: freshHash() };
    const t = await runTrial(dbName, 'mut.take_rate_limit', repeatPlan(N, sj), 3);
    const ev = await evaluate(admin, 'mut.rate_limit_buckets', t, 3, { allowed: 3, denied: N - 3, preexisting: 0 });
    if (Object.values(ev.checks).some((ok) => !ok)) { detectedNew++; seen.add(Object.entries(ev.checks).filter(([, ok]) => !ok).map(([k]) => k)[0]); }
    console.log(`      mutant new-subject trial ${i + 1}: ${ev.detail}`);
  }
  for (let i = 0; i < TRIALS; i++) {
    const sj = { purpose: 'conc.mut', hash: freshHash() };
    const sv = await connect(dbName, 'service_role');
    await sv.query('select * from mut.take_rate_limit($1, $2, 3, 60)', [sj.purpose, sj.hash]);
    await close(sv);
    const t = await runTrial(dbName, 'mut.take_rate_limit', repeatPlan(N, sj), 3);
    const ev = await evaluate(admin, 'mut.rate_limit_buckets', t, 3, { allowed: 2, denied: N - 2, preexisting: 1 });
    if (Object.values(ev.checks).some((ok) => !ok)) detectedExisting++;
    console.log(`      mutant existing-bucket trial ${i + 1}: ${ev.detail}`);
  }
  record(s, 'mutation proof: non-atomic take_rate_limit FAILS the new-subject trial', detectedNew === TRIALS, `detected in ${detectedNew}/${TRIALS} trials`);
  record(s, 'mutation proof: non-atomic take_rate_limit FAILS the existing-bucket trial', detectedExisting === TRIALS, `detected in ${detectedExisting}/${TRIALS} trials`);
  await admin.query('drop schema mut cascade');
}

// ---------------------------------------------------------------------------

async function newDatabase(root, name) {
  await root.query(`create database ${name}`);
  const db = await connect(name);
  await db.query(DB_STUBS);
  return db;
}

async function main() {
  const dataDir = mkdtempSync(join(tmpdir(), 'pg-rehearsal-'));
  const serverLog = [];
  const server = new EmbeddedPostgres({
    databaseDir: dataDir, user: USER, password: PASSWORD, port: PORT, persistent: false,
    autoRehydrateSymlinks: true,
    postgresFlags: ['-c', 'max_connections=200', '-c', 'fsync=off', '-c', 'listen_addresses=127.0.0.1'],
    onLog: (m) => serverLog.push(String(m)), onError: (m) => serverLog.push(String(m)),
  });
  let started = false;
  try {
    await server.initialise();
    await server.start();
    started = true;
    const root = await connect('postgres');
    const ver = await one(root, `select version() v, current_setting('server_version_num')::int n, current_setting('max_connections')::int mc`);
    console.log(`# ${ver.v}\n# cluster ${dataDir} on 127.0.0.1:${PORT}, max_connections ${ver.mc}\n`);
    record('cluster', 'server is PostgreSQL 17', Math.floor(ver.n / 10000) === 17, `server_version_num ${ver.n}`);
    await root.query(CLUSTER_ROLES);
    await root.query(CLUSTER_ROLES); // roles are cluster-wide: second run proves the guard

    // A. Fresh: schema.sql, then the chain twice.
    const A = 'A fresh schema.sql';
    const a = await newDatabase(root, 'scn_a');
    await assertRoles(a, A);
    await apply(a, A, 'schema.sql (run 1)', schemaSql);
    const freshSnap = await snapshot(a);
    await apply(a, A, 'schema.sql (run 2)', schemaSql, { expectFail: 'already exists' });
    for (const pass of [1, 2]) for (const m of migrations) await apply(a, A, `${m.name} (chain pass ${pass})`, m.sql);
    compare(A, freshSnap, await snapshot(a), 'schema.sql before migrations (chain is a no-op)');
    await assertLimiter(a, 'scn_a', A);
    await assertStaff(a, 'scn_a', A);
    await assertConcurrency(a, 'scn_a', A);
    await mutationProof(a, 'scn_a', A);

    // B/C. June schema (with and without its patch block), each file twice in order, then the chain again.
    for (const [label, name, june] of [['B June schema', 'scn_b', juneFull], ['C June schema without patch', 'scn_c', juneNoPatch]]) {
      const db = await newDatabase(root, name);
      await apply(db, label, 'june schema.sql', june);
      for (const m of migrations) {
        await apply(db, label, `${m.name} (run 1)`, m.sql);
        await apply(db, label, `${m.name} (run 2)`, m.sql);
      }
      for (const m of migrations) await apply(db, label, `${m.name} (chain pass 3)`, m.sql);
      compare(label, freshSnap, await snapshot(db), 'fresh schema.sql');
      await assertLimiter(db, name, label);
      await assertStaff(db, name, label);
      await assertConcurrency(db, name, label);
    }
    await close(root);
  } finally {
    await Promise.all(open.map(close));
    if (started) await server.stop().catch((e) => console.error('stop failed', e));
    rmSync(dataDir, { recursive: true, force: true });
    if (failures || process.exitCode === 2) console.error(serverLog.slice(-15).join('\n'));
  }
  const perScenario = {};
  for (const r of results) { perScenario[r.scenario] ??= { n: 0, bad: 0 }; perScenario[r.scenario].n++; if (!r.ok) perScenario[r.scenario].bad++; }
  console.log('\nPer scenario:');
  for (const [k, v] of Object.entries(perScenario)) console.log(`  ${k}: ${v.n - v.bad}/${v.n}`);
  console.log(`\n${results.length - failures}/${results.length} checks passed, ${failures} failed`);
  process.exitCode = failures ? 1 : 0;
}
main().catch((e) => { console.error(e); process.exitCode = 2; });
