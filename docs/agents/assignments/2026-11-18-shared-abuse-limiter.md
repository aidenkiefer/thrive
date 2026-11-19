# Assignment: 2026-11-18-shared-abuse-limiter

**Session goal:** Replace per-instance OTP and native-form throttles with one fail-closed, privacy-preserving limiter shared across serverless instances.
**Inputs read:** GitHub Project 3; draft PRs #15, #18, and #23; `docs/agents/assignments/2026-11-18-batch-2.md` (R1 stack order); Claude read-only review of the active Data worktrees.
**Owner approval:** approved 2026-11-18 (Postgres strategy)
**Stack:** Data PR #15 (staff actor + native form registry, base `main`) → PR #18 (Resend transport, base #15) → PR #23 (shared Postgres abuse limiter, base #18). This is the R1 order in `2026-11-18-batch-2.md`. All three remain draft. This assignment does not reopen the completed D1R–D3 scope of #15 and #18.
**Implementation:** already open as draft [PR #23](https://github.com/aidenkiefer/thrive/pull/23) (`claude/data-shared-limiter`, base `claude/data-resend-transport`). This document is the assignment record and QA checklist for that PR; do not create the branch again.

## Lane map

| Lane | Tool | Branch | Worktree | Default tier |
|---|---|---|---|---|
| data | claude | `claude/data-shared-limiter` (PR #23) | `../thrive-worktrees/claude-data-shared-limiter` | T2 design → T1 implement |

No Experience or Ops work is assigned. CMS publishing remains blocked until PRs #15, #18, and #23 pass QA and configured Preview verification.

## Hot-file owners

| File | Owner lane |
|---|---|
| `supabase/schema.sql`, new limiter migration | data |
| `src/lib/admin-identities.ts`, admin-login API routes | data |
| `src/app/api/forms/[formId]/route.ts`, new shared limiter module | data |

Do not edit `package*.json`, Vitest configuration, PR #18's Resend adapter, public UI, redirects, or planning docs outside the lane's own session log.

## Contract

`takeSharedRateLimit(input, deps?): Promise<{ allowed: boolean; retryAfterSeconds: number; reason: 'ok' | 'limited' | 'unavailable' }>` in `src/lib/rate-limit/index.ts` (as implemented in PR #23) uses one atomic, service-role-only Postgres operation (`take_rate_limit`). `input` is `{ purpose, subjectHash, limit, windowSeconds }`: a purpose, an HMAC-hashed subject key, a limit, and a window. Callers normally go through `createSubjectLimiter(...)`, which hashes an already-normalized subject with `RATE_LIMIT_HASH_SECRET` and then calls `takeSharedRateLimit`. Every failure (bad input, missing configuration, store error, timeout) denies with `reason: 'unavailable'`. No raw email, IP address, form content, or secret is persisted.

## Merge order

1. PR #15 (staff actor + native form registry), base `main`.
2. PR #18 (Resend transport), base #15.
3. PR #23 (shared Postgres abuse limiter), base #18, after security and migration review.
4. Configured Preview verification; only then unblock CMS and feedback release work.

## Lane: data, shared abuse limiter

**Tool:** claude · **Branch:** `claude/data-shared-limiter` (PR #23) stacked on `claude/data-resend-transport` (PR #18) · **Default tier:** T2 design → T1 implement
**Owned paths:** new `src/lib/rate-limit/**`; narrow edits to `src/lib/admin-identities.ts`, `src/app/api/admin-login/**`, `src/app/api/forms/[formId]/route.ts`; matching colocated tests; new `supabase/migrations/**`; `supabase/schema.sql`; own session log
**Read first (≤3):** `src/lib/admin-identities.ts`, `src/app/api/forms/[formId]/route.ts`, `supabase/migrations/20261118000000_admin_staff_accounts.sql` (these three exist only on the PR #15 stack until it merges, not yet on `main`)
**Out of scope:** live Supabase calls or migrations; Vercel Firewall changes; Resend transport changes; CMS revisions; changing auth provider/session design; logging submitted values or raw limiter subjects

### Tickets

**D1L-A · Atomic private limiter contract** · M · T2→T1
- Task: Add a Postgres-backed limiter and a server-only TypeScript boundary shared by all app instances.
- Files: new guarded migration, `supabase/schema.sql`, new `src/lib/rate-limit/**`, colocated tests.
- Done when: one atomic operation enforces purpose + hashed subject + fixed window; RLS is enabled with no public policies; table privileges are revoked from `anon`/`authenticated`; function execution is restricted to `service_role`; expired buckets have a bounded cleanup path; repeated migration application is safe; no raw email/IP/form data is stored; tests use a fake store and make no live call.
- Skills: `postgres-best-practices`

**D1L-B · OTP and form integration** · M · T1
- Task: Replace the in-memory request-code, verify-code, and native-form maps with D1L-A, preserving generic auth responses and F1 result semantics.
- Files: `src/lib/admin-identities.ts`, narrow admin-login API route edits if required, `src/app/api/forms/[formId]/route.ts`, matching tests.
- Done when: request, verification, and form limits are shared through the contract; email and IP subjects are normalized then irreversibly hashed with a server secret and purpose separation; store/configuration failure denies auth safely and returns F1 `unavailable` without leaking whether a staff identity exists; tests prove two limiter instances share counts, boundary/expiry behavior, purpose isolation, and fail-closed behavior; targeted tests and `scripts/agents/gate.sh` pass; no live message or database request occurs.

**Lane done when:** both tickets are complete or parked with a reason; gate passes; a draft stacked PR (#23) targets `claude/data-resend-transport`; the scribe body records migration, secret, Preview, and rollback requirements.

## QA focus

- Review atomicity under concurrent requests, subject normalization/hash separation, grants/RLS, cleanup bounds, and fail-closed behavior.
- Confirm responses do not disclose staff membership or submitted form content and logs contain neither raw limiter subjects nor secrets.
- Verify PR #23 does not absorb PR #18's Resend adapter or modify the public UI. A green local gate does not replace configured Preview tests.

## Owner-controlled follow-up

- Provision the isolated Preview database and apply reviewed migrations.
- Configure a dedicated limiter hashing secret, Supabase code-only Auth email template/SMTP, form sender/key/default inbox, and preprovisioned staff memberships.
- Verify wrong, expired, replayed, disabled, rebound, and rate-limited sign-in paths plus sandbox form delivery before any production merge.
