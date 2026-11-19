# Assignment: 2026-11-18-shared-abuse-limiter

**Session goal:** Replace per-instance OTP and native-form throttles with one fail-closed, privacy-preserving limiter shared across serverless instances.
**Inputs read:** GitHub Project 3; planning PR #14; draft PRs #15 and #18; `2026-11-18-development-kickoff.md`; `2026-11-18-mvp-development-architecture.md`; Claude read-only review of the active Data worktrees.
**Owner approval:** approved 2026-11-18 (Postgres strategy)
**Carry-over:** PR #15 is the base and remains draft. PR #18 stays separately stacked on #15. This assignment does not reopen their completed D1R–D3 scope.

## Lane map

| Lane | Tool | Branch | Worktree | Default tier |
|---|---|---|---|---|
| data | claude | `claude/data-shared-limiter` | `../thrive-worktrees/claude-data-shared-limiter` | T2 design → T1 implement |

No Experience or Ops work is assigned. CMS publishing remains blocked until PR #15 and this limiter pass QA and configured Preview verification.

## Hot-file owners

| File | Owner lane |
|---|---|
| `supabase/schema.sql`, new limiter migration | data |
| `src/lib/admin-identities.ts`, admin-login API routes | data |
| `src/app/api/forms/[formId]/route.ts`, new shared limiter module | data |

Do not edit `package*.json`, Vitest configuration, PR #18's Resend adapter, public UI, redirects, or planning docs outside the lane's own session log.

## Contract

`takeSharedRateLimit(input): Promise<{ allowed: boolean; retryAfterSeconds: number }>` uses one atomic, service-role-only Postgres operation. Callers supply a purpose, a hashed subject key, a limit, and a window; no raw email, IP address, form content, or secret is persisted.

## Merge order

1. PR #15 identity/form contract.
2. This stacked limiter PR after security and migration review.
3. PR #18 rebased onto the reviewed result.
4. Configured Preview verification; only then unblock CMS and feedback release work.

## Lane: data, shared abuse limiter

**Tool:** claude · **Branch:** `claude/data-shared-limiter` stacked on `claude/data-mvp-foundations` · **Default tier:** T2 design → T1 implement
**Owned paths:** new `src/lib/rate-limit/**`; narrow edits to `src/lib/admin-identities.ts`, `src/app/api/admin-login/**`, `src/app/api/forms/[formId]/route.ts`; matching colocated tests; new `supabase/migrations/**`; `supabase/schema.sql`; own session log
**Read first (≤3):** `src/lib/admin-identities.ts`, `src/app/api/forms/[formId]/route.ts`, `supabase/migrations/20261118000000_admin_staff_accounts.sql`
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

**Lane done when:** both tickets are complete or parked with a reason; gate passes; a draft stacked PR targets `claude/data-mvp-foundations`; the scribe body records migration, secret, Preview, and rollback requirements.

## QA focus

- Review atomicity under concurrent requests, subject normalization/hash separation, grants/RLS, cleanup bounds, and fail-closed behavior.
- Confirm responses do not disclose staff membership or submitted form content and logs contain neither raw limiter subjects nor secrets.
- Verify the stack does not absorb PR #18 or modify the public UI. A green local gate does not replace configured Preview tests.

## Owner-controlled follow-up

- Provision the isolated Preview database and apply reviewed migrations.
- Configure a dedicated limiter hashing secret, Supabase code-only Auth email template/SMTP, form sender/key/default inbox, and preprovisioned staff memberships.
- Verify wrong, expired, replayed, disabled, rebound, and rate-limited sign-in paths plus sandbox form delivery before any production merge.
