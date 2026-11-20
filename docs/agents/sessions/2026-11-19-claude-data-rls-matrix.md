# Session log: `claude/data-rls-matrix`

**Ticket:** #45 (Data, M, T2 audit → T1 tests) · **Lane:** Data · **Tool:** claude · **Started:** 2026-11-19 · **Stacked on:** #95 (`claude/data-pg-rehearsal`, the D1L-C harness)

## Status
Done: policy audit, RLS matrix on the #95 harness (948/948 on Postgres 17), admin-guard test (7 tests). No fix migration needed. One owner note (TRUNCATE). Draft until #95 merges.

## Findings (audit, verified on the harness)
| Item | Result |
|---|---|
| 12 content tables: RLS on, SELECT-only policies | Verified. anon and authenticated see published rows only; inserts, updates and deletes are all refused (no write policies) |
| `public_read_speakers`, `public_read_staff` use `using (true)` | By design (no draft concept). Every row is readable; `speakers.email`, `staff.email` and `staff.phone` are refused by column grants (42501) |
| `public_read_event_occurrences` joins its parent's published state | Verified: only occurrences that are not cancelled and whose parent is published are visible; the subquery runs under the caller's RLS |
| `public_read_announcements` | Verified: drafts and expired rows are hidden |
| Service-only `admin_staff_accounts`, `rate_limit_buckets`, `take_rate_limit`, `prune_rate_limit_buckets` | Not reachable by anon or authenticated |
| **TRUNCATE** on the 12 content tables held by anon and authenticated (Supabase-style default privileges) | **Owner note, not a fix.** RLS doesn't cover TRUNCATE, but PostgREST has no truncate operation and both roles are `nologin`, so the API can't reach it. Optional hardening: an additive migration revoking `truncate, references, trigger` from anon and authenticated |
| Admin guard | Every admin page render and all 10 server actions call `requireAdmin()` or `adminDb()` (which guards first) before data access; no admin file builds its own Supabase client; the middleware matches `/admin/:path*` and exempts only `/admin/login` |

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `17:40` **decision** stacked on #95: the issue requires reusing the D1L-C harness. The matrix lives in `src/lib/security/rls-matrix.mjs` (Allowed files), plain ESM so the standalone harness imports it; `rehearse-pg.mjs` gets one import and three calls (Data-owned file, from #95) (T2, opus)
- `17:40` **decision** guard rule: a guard call comes before any `.from(`, `.rpc(`, `createClient(` or `fetch(` in each action and page body. Not "first await", because pages await `searchParams` first (T1, opus)
- `17:40` **change** RLS matrix, 125 checks per scenario (375 total); harness 948/948. Mutation: `using (true)` on sermons + `email` in the speakers grant (schema and migration) → 8 matrix FAILs, exit 1 (T1, opus)
- `17:40` **change** `src/lib/security/admin-guard.test.ts`, 7 tests. Mutations: dropping `requireAdmin()` from the dashboard, or from `adminDb()`, fails (T1, opus)
- `17:40` **note** once #96 (R2b) lands on this stack, re-run the harness: any new table must be classified in `CONTENT_TABLES` or `SERVICE_TABLES`, or the matrix fails by design
- `17:40` **blocker** owner decision (non-blocking): revoke TRUNCATE (and REFERENCES, TRIGGER) on the content tables from anon and authenticated? Recommended: yes, as one additive migration, applied with the next migration batch
