# Session log: `claude/data-shared-limiter`

**Assignment:** `docs/agents/assignments/2026-11-18-shared-abuse-limiter.md` (on PR #21, not yet on main) · **Lane:** data · **Tool:** claude · **Started:** 2026-11-18

## Status
In progress: shared abuse limiter (D1L). Stacked on `claude/data-mvp-foundations` (PR #15).

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `21:21` **decision** D1L-A: design on Opus 5.5 (T2). Table `public.rate_limit_buckets` keyed (purpose, window_seconds, subject_hash); subject_hash must be 64-hex HMAC-SHA256 (CHECK constraint, so raw email/IP cannot be stored). One atomic INSERT ... ON CONFLICT DO UPDATE in plpgsql `public.take_rate_limit` (security invoker, search_path ''), fixed window, count capped at limit+1. Bounded cleanup of max 25 expired rows per call via FOR UPDATE SKIP LOCKED plus `prune_rate_limit_buckets(max<=10000)`. RLS on, no policies; table and functions revoked from public/anon/authenticated, granted only to service_role. Idempotent migration `supabase/migrations/20261118010000_shared_rate_limit.sql` mirrored into `supabase/schema.sql`. TS boundary `src/lib/rate-limit/` (`takeSharedRateLimit` returns {allowed, retryAfterSeconds, reason ok|limited|unavailable}; every failure denies). Subject hashing secret env: `RATE_LIMIT_HASH_SECRET` (>=32 chars, dedicated, no fallback).
- `21:21` **note**: implementation delegated to two Sonnet subagents (SQL + schema mirror + static SQL tests; TS boundary + fake store tests) on non-overlapping Data-lane files. Read-only security/concurrency review before push.
- `21:21` **note**: `vitest.config.mts` includes only `tests/**` (Ops-owned), so Data tests under `src/**` run via a gitignored local config at `node_modules/.cache/vitest.data.mjs`. The earlier Ops request to widen include still stands.
- `21:21` **note**: no local Postgres available. SQL verified by static assertions and review only; must be exercised on the configured Preview database.
- `21:30` **note**: read-only Opus review of D1L-A found no blockers. Fixed: `hashLimiterSubject` now enforces the 32-char secret minimum itself; only a configured store is cached (late env is picked up); doc states one limit/window per purpose; added a timeout/abort test. Parked: `import 'server-only'` (package not installed, `package*.json` off limits); real-Postgres checks (below).
- `21:31` **request** ops: add the `server-only` dependency so `src/lib/rate-limit/index.ts` can import it (turns an accidental client import into a build error). Also, again, widen the vitest include to `src/**/*.test.ts`.
- `21:32` **checkpoint** D1L-A · Opus 5.5 design, Sonnet implementation, Opus review · Atomic, service-role-only Postgres limiter and fail-closed TS boundary. Gate PASS (13 pre-existing lint warnings, none in new files); 99 Data tests pass under the local config.

## Owner: Preview verification and rollback (D1L)

**Env (names only):** `RATE_LIMIT_HASH_SECRET` (new, dedicated, random, at least 32 chars; set separately per environment, never reuse `NEXTAUTH_SECRET`). The limiter also uses the existing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. If any is missing, sign-in and native forms deny (fail closed).

**Apply:** run `supabase/migrations/20261118010000_shared_rate_limit.sql` on the isolated Preview database only, after PR #15's migration. It is safe to run twice.

**Verify in the Preview SQL editor:**
```sql
select has_table_privilege('anon', 'public.rate_limit_buckets', 'select'),
       has_table_privilege('authenticated', 'public.rate_limit_buckets', 'select'),
       has_function_privilege('anon', 'public.take_rate_limit(text,text,integer,integer)', 'execute'),
       has_function_privilege('authenticated', 'public.take_rate_limit(text,text,integer,integer)', 'execute'),
       has_function_privilege('anon', 'public.prune_rate_limit_buckets(integer)', 'execute');  -- all false
select * from public.take_rate_limit('verify.test', repeat('a', 64), 2, 60);  -- run 3 times: true, true, false (+retry)
delete from public.rate_limit_buckets where purpose = 'verify.test';
```
Also run the migration a second time and repeat the privilege query. Optional concurrency check: 50 parallel calls with limit 3 must allow exactly 3.

**Rollback:** counters are disposable. `drop function if exists public.take_rate_limit(text, text, integer, integer); drop function if exists public.prune_rate_limit_buckets(integer); drop table if exists public.rate_limit_buckets;` Revert the app commit at the same time, or every limited path will deny.
