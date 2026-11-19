# Session log: `claude/data-route-inventory`

**Ticket:** #48 (Data, S, T1) · **Lane:** Data · **Tool:** claude · **Started:** 2026-11-19 · **Stacked on:** #23 (`claude/data-shared-limiter`)

## Status
Done: #48 manifest + coverage test + fail-closed route tests. Draft until #23 merges.

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `16:30` **decision** stacked on #23, not main: the issue depends on #23's shared limiter, and #23 is unmerged (T1, opus)
- `16:30` **decision** `api/auth/[...nextauth]` is classed `limited`, not `exempt`: its credentials `authorize` reaches `otp.verify.ip`/`otp.verify.email`. The other NextAuth endpoints are documented in the manifest note; NextAuth config unchanged (T1, opus)
- `16:30` **decision** the login-route fail-closed test lives in `src/lib/rate-limit/routes.test.ts` (Allowed files) and drives the real route handler, instead of adding a test under `src/app/api/**` (T1, opus)
- `16:30` **change** `src/lib/rate-limit/routes.ts` (manifest, 3 routes) + `routes.test.ts` (6 tests). Mutations: an unlisted dummy route fails, and a healthy store in the fail-closed tests fails both route tests (T1, opus)
