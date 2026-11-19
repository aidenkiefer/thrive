// D1L-C rehearsal: run supabase/schema.sql and supabase/migrations/*.sql on PGlite
// (WASM Postgres) and assert on the D1L limiter and D1R staff-table objects.
// Usage (from this directory): npm ci && npm run rehearse   # exit 0 = all checks pass
//    or: node rehearse.mjs [repo-root]   (defaults to the repo this file is in)
// The June baseline schema comes from this checkout's git history (commit cd012bd).
import { PGlite } from '@electric-sql/pglite';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

// Supabase-like roles. service_role has BYPASSRLS on Supabase; anon and
// authenticated do not. Default privileges mirror Supabase's: everything new in
// public is granted to all three API roles, so the migrations' revokes matter.
const SUPABASE_STUBS = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;
  create role rls_probe nologin noinherit;  -- has grants but no bypassrls (control)
  grant usage on schema public to anon, authenticated, service_role, rls_probe;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

async function freshDb() {
  const db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  return db;
}

async function apply(db, scenario, name, sql, { expectFail } = {}) {
  try {
    await db.exec(sql);
    record(scenario, `apply ${name}`, !expectFail, expectFail ? `expected failure: ${expectFail}` : '');
  } catch (e) {
    await db.exec('rollback').catch(() => {});
    const msg = e.message.split('\n')[0];
    if (expectFail && msg.includes(expectFail)) record(scenario, `apply ${name} (expected failure)`, true, msg);
    else record(scenario, `apply ${name}`, false, msg);
  }
}

async function expectError(db, scenario, item, sql, code) {
  try {
    await db.exec(sql);
    record(scenario, item, false, 'no error raised');
  } catch (e) {
    await db.exec('reset role').catch(() => {});
    record(scenario, item, e.code === code, `${e.code} ${e.message.split('\n')[0]}`);
  }
}

const one = async (db, sql, params) => (await db.query(sql, params)).rows[0];
const H = (c) => c.repeat(64);
const take = (db, purpose, hash, limit, win) =>
  one(db, 'select * from public.take_rate_limit($1, $2, $3, $4)', [purpose, hash, limit, win]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    triggers: await q(`select tgrelid::regclass::text, tgname, pg_get_triggerdef(oid) from pg_trigger
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

async function assertLimiter(db, s) {
  const T = 'public.rate_limit_buckets';
  const TAKE = 'public.take_rate_limit(text,text,integer,integer)';
  const PRUNE = 'public.prune_rate_limit_buckets(integer)';

  // RLS on, no policies.
  const rls = await one(db, `select relrowsecurity, relforcerowsecurity from pg_class where oid = '${T}'::regclass`);
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

  // Privileges: behaviour.
  for (const role of ['anon', 'authenticated']) {
    const as = (sql) => `set role ${role}; ${sql}; reset role;`;
    await expectError(db, s, `${role} select denied`, as(`select * from ${T}`), '42501');
    await expectError(db, s, `${role} insert denied`, as(`insert into ${T} values ('x.y', 60, '${H('a')}', now(), now() + interval '1 minute', 1)`), '42501');
    await expectError(db, s, `${role} update denied`, as(`update ${T} set hits = 1`), '42501');
    await expectError(db, s, `${role} delete denied`, as(`delete from ${T}`), '42501');
    await expectError(db, s, `${role} take_rate_limit denied`, as(`select * from public.take_rate_limit('x.y', '${H('a')}', 1, 60)`), '42501');
    await expectError(db, s, `${role} prune denied`, as(`select public.prune_rate_limit_buckets(10)`), '42501');
  }
  await db.exec('set role service_role');
  try {
    const r = await take(db, 'svc.check', H('b'), 5, 60);
    record(s, 'service_role can call take_rate_limit', r.allowed === true);
    const sel = await one(db, `select count(*)::int n from ${T} where purpose = 'svc.check'`);
    record(s, 'service_role can select (sees its row through RLS)', sel.n === 1);
    await db.exec(`update ${T} set hits = 2 where purpose = 'svc.check'`);
    await db.exec(`insert into ${T} values ('svc.ins', 60, '${H('c')}', now(), now() + interval '1 minute', 1)`);
    await db.exec(`delete from ${T} where purpose in ('svc.check', 'svc.ins')`);
    record(s, 'service_role can insert/update/delete', true);
    const pr = await one(db, 'select public.prune_rate_limit_buckets(10) n');
    record(s, 'service_role can call prune', typeof pr.n === 'number');
  } catch (e) {
    record(s, 'service_role usage', false, e.message);
  } finally {
    await db.exec('reset role');
  }
  // Control: same grants without BYPASSRLS → RLS (no policies) blocks the write.
  await db.exec(`grant select, insert, update, delete on ${T} to rls_probe; grant execute on function ${TAKE} to rls_probe;`);
  await expectError(db, s, 'control: granted role WITHOUT bypassrls is blocked by RLS (service_role relies on BYPASSRLS)',
    `set role rls_probe; select * from public.take_rate_limit('probe.x', '${H('d')}', 1, 60); reset role;`, '42501');
  await db.exec(`revoke all on ${T} from rls_probe; revoke execute on function ${TAKE} from rls_probe;`);

  // Hash / purpose CHECK constraints on direct writes.
  const ins = (purpose, hash) => `insert into ${T} values ('${purpose}', 60, '${hash}', now(), now() + interval '1 minute', 1)`;
  const badHashes = { '63 hex': 'a'.repeat(63), '65 hex': 'a'.repeat(65), uppercase: 'A'.repeat(64), 'non-hex': 'g'.repeat(64),
    'raw email': 'person@example.org', empty: '', 'trailing newline': 'a'.repeat(64) + '\n' };
  for (const [label, h] of Object.entries(badHashes)) {
    await expectError(db, s, `table CHECK rejects subject_hash: ${label}`, ins('chk.x', h.replace(/'/g, "''")), '23514');
  }
  await expectError(db, s, 'table CHECK rejects bad purpose', ins('Bad Purpose', H('a')), '23514');
  await expectError(db, s, 'table CHECK rejects window 0', `insert into ${T} values ('chk.x', 0, '${H('a')}', now(), now() + interval '1 minute', 1)`, '23514');
  await expectError(db, s, 'table CHECK rejects hits 0', `insert into ${T} values ('chk.x', 60, '${H('a')}', now(), now() + interval '1 minute', 0)`, '23514');
  await expectError(db, s, 'table CHECK rejects expires_at <= window_start', `insert into ${T} values ('chk.x', 60, '${H('a')}', now(), now(), 1)`, '23514');
  await db.exec(ins('chk.ok', H('e')));
  record(s, 'table accepts valid 64-char lowercase hex', true);
  await db.exec(`delete from ${T}`);

  // Invalid function arguments → 22023.
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
    await expectError(db, s, `take_rate_limit rejects ${label}`, `select * from public.take_rate_limit(${p}, ${h}, ${l}::int, ${w}::int)`, '22023');
  }
  for (const v of ['0', '10001', 'null']) {
    await expectError(db, s, `prune rejects bound ${v}`, `select public.prune_rate_limit_buckets(${v}::int)`, '22023');
  }
  const cnt = await one(db, `select count(*)::int n from ${T}`);
  record(s, 'rejected calls wrote no rows', cnt.n === 0);

  // Counting: first hit, boundary, over limit, cap, retry value. Run as service_role.
  await db.exec('set role service_role');
  try {
    const seq = [];
    for (let i = 0; i < 5; i++) seq.push(await take(db, 'cnt.a', H('1'), 3, 60));
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

    // Limit 1 edge.
    const l1 = [await take(db, 'cnt.one', H('2'), 1, 60), await take(db, 'cnt.one', H('2'), 1, 60)];
    record(s, 'limit 1: first allowed, second denied', l1[0].allowed && !l1[1].allowed);

    // Isolation: purpose, subject, window length.
    const iso1 = await take(db, 'cnt.b', H('1'), 3, 60);
    record(s, 'purpose isolation: same subject under another purpose starts fresh', iso1.allowed === true);
    const iso2 = await take(db, 'cnt.a', H('9'), 3, 60);
    record(s, 'subject isolation: another subject under same purpose starts fresh', iso2.allowed === true);
    const iso3 = await take(db, 'cnt.a', H('1'), 3, 120);
    record(s, 'window isolation: same purpose+subject with another window length is a separate bucket', iso3.allowed === true);
    const n = await one(db, `select count(*)::int n from ${T} where subject_hash = '${H('1')}'`);
    record(s, 'separate rows per (purpose, window, subject)', n.n === 3, `${n.n} rows`);
    const still = await take(db, 'cnt.a', H('1'), 3, 60);
    record(s, 'original bucket still denied after isolation calls', still.allowed === false);

    // Window expiry, simulated: move the denied bucket into the past (superuser).
    await db.exec('reset role');
    await db.exec(`update ${T} set window_start = window_start - interval '1 hour', expires_at = expires_at - interval '1 hour'
                   where purpose = 'cnt.a' and window_seconds = 60 and subject_hash = '${H('1')}'`);
    await db.exec('set role service_role');
    const after = await take(db, 'cnt.a', H('1'), 3, 60);
    const row2 = await one(db, `select hits, expires_at > clock_timestamp() live from ${T} where purpose='cnt.a' and window_seconds=60 and subject_hash='${H('1')}'`);
    record(s, 'expired window (simulated): next hit allowed and counter resets to 1', after.allowed && row2.hits === 1 && row2.live);

    // Window expiry, real clock: 1-second window, wait for the boundary.
    const msToBoundary = 1000 - (Date.now() % 1000);
    if (msToBoundary < 300) await sleep(msToBoundary + 20);
    const r1 = [await take(db, 'cnt.real', H('3'), 1, 1), await take(db, 'cnt.real', H('3'), 1, 1)];
    await sleep(1100);
    const r2 = await take(db, 'cnt.real', H('3'), 1, 1);
    record(s, 'real 1s window: allowed, denied (retry 1), allowed after boundary',
      r1[0].allowed && !r1[1].allowed && r1[1].retry_after_seconds === 1 && r2.allowed);
  } catch (e) {
    record(s, 'counting scenarios', false, e.message);
  } finally {
    await db.exec('reset role');
  }

  // Cleanup removes only expired rows.
  await db.exec(`delete from ${T}`);
  await db.exec(`insert into ${T}
    select 'gc.old', 60, lpad(to_hex(g), 64, '0'), now() - interval '2 hours', now() - interval '1 hour', 1 from generate_series(1, 30) g;
    insert into ${T}
    select 'gc.live', 60, lpad(to_hex(g), 64, '0'), now(), now() + interval '1 hour', 1 from generate_series(1, 10) g;`);
  await db.exec('set role service_role');
  await take(db, 'gc.caller', H('4'), 5, 60);
  await db.exec('reset role');
  let c = await one(db, `select count(*) filter (where purpose = 'gc.old')::int old, count(*) filter (where purpose = 'gc.live')::int live,
                         count(*) filter (where purpose = 'gc.caller')::int caller from ${T}`);
  record(s, 'take_rate_limit inline cleanup deletes at most 25 expired rows', c.old === 5, `${c.old} expired left`);
  record(s, 'inline cleanup keeps live rows and the caller row', c.live === 10 && c.caller === 1);
  await db.exec('set role service_role');
  const pr1 = await one(db, 'select public.prune_rate_limit_buckets(3) n');
  const pr2 = await one(db, 'select public.prune_rate_limit_buckets() n');
  const pr3 = await one(db, 'select public.prune_rate_limit_buckets() n');
  await db.exec('reset role');
  c = await one(db, `select count(*) filter (where purpose = 'gc.old')::int old, count(*) filter (where purpose <> 'gc.old')::int other from ${T}`);
  record(s, 'prune honours its bound and returns the count', pr1.n === 3 && pr2.n === 2 && pr3.n === 0, `${pr1.n}, ${pr2.n}, ${pr3.n}`);
  record(s, 'prune removes only expired rows', c.old === 0 && c.other === 11, `${c.other} live left`);
  await db.exec(`delete from ${T}`);
}

// D1R staff table (QA S6): rows survive delete and truncate, and service_role
// has only select/insert/update even though default privileges grant it all.
async function assertStaff(db, s) {
  const T = 'public.admin_staff_accounts';
  for (const p of ['select', 'insert', 'update']) {
    const r = await one(db, `select has_table_privilege('service_role', '${T}', '${p}') v`);
    record(s, `service_role has ${p} on staff table`, r.v === true);
  }
  for (const p of ['delete', 'truncate', 'references', 'trigger']) {
    const r = await one(db, `select has_table_privilege('service_role', '${T}', '${p}') v`);
    record(s, `service_role lacks ${p} on staff table`, r.v === false);
  }
  for (const role of ['anon', 'authenticated']) {
    const r = await one(db, `select has_table_privilege('${role}', '${T}', 'select') v`);
    record(s, `${role} lacks select on staff table`, r.v === false);
  }
  await db.exec(`insert into ${T} (email, auth_user_id) values ('rehearsal@example.org', gen_random_uuid())`);
  await expectError(db, s, 'service_role truncate on staff table denied',
    `set role service_role; truncate ${T}; reset role;`, '42501');
  await expectError(db, s, 'service_role delete on staff table denied',
    `set role service_role; delete from ${T}; reset role;`, '42501');
  // Owner (superuser here) bypasses grants, so only the triggers stand in the way.
  await expectError(db, s, 'owner truncate on staff table raised by trigger', `truncate ${T}`, 'P0001');
  await expectError(db, s, 'owner delete on staff table raised by trigger', `delete from ${T}`, 'P0001');
  const n = await one(db, `select count(*)::int n from ${T}`);
  record(s, 'staff row survives truncate and delete attempts', n.n === 1, `${n.n} rows`);
}

async function main() {
  const v = await (await PGlite.create()).query('select version() v');
  console.log(`# ${v.rows[0].v}\n`);

  // A. Fresh: schema.sql, then the chain twice.
  const A = 'A fresh schema.sql';
  const a = await freshDb();
  await apply(a, A, 'schema.sql (run 1)', schemaSql);
  const freshSnap = await snapshot(a);
  await apply(a, A, 'schema.sql (run 2)', schemaSql, { expectFail: 'already exists' });
  for (const pass of [1, 2]) for (const m of migrations) await apply(a, A, `${m.name} (chain pass ${pass})`, m.sql);
  compare(A, freshSnap, await snapshot(a), 'schema.sql before migrations (chain is a no-op)');
  await assertLimiter(a, A);
  await assertStaff(a, A);

  // B/C. June schema (with and without its patch block), each file twice in order, then the chain again.
  for (const [label, june] of [['B June schema', juneFull], ['C June schema without patch', juneNoPatch]]) {
    const db = await freshDb();
    await apply(db, label, 'june schema.sql', june);
    for (const m of migrations) {
      await apply(db, label, `${m.name} (run 1)`, m.sql);
      await apply(db, label, `${m.name} (run 2)`, m.sql);
    }
    for (const m of migrations) await apply(db, label, `${m.name} (chain pass 3)`, m.sql);
    compare(label, freshSnap, await snapshot(db), 'fresh schema.sql');
    await assertLimiter(db, label);
    await assertStaff(db, label);
  }

  console.log(`\n${results.length - failures}/${results.length} checks passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
