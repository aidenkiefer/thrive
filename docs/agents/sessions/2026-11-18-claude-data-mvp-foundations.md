# Session log: `claude/data-mvp-foundations`

**Assignment:** `docs/agents/assignments/2026-11-18-development-kickoff.md` (planning PR #14, not yet merged; read from the planning worktree) · **Lane:** data · **Tool:** claude · **Started:** 2026-11-18

## Status
D1 and D2 implemented; gate passes (typecheck, lint, 54 tests via a local config, build). Draft PR: runtime configuration outstanding.
Blocked on owner inputs for deployment only: OIDC provider and staff subjects, mail provider, sender, feedback inbox.

## Entries
- `19:20` **change** D1: `src/lib/admin-identities.ts` (pure A1 contract: `resolveActor`, `actorIdFor`, allowlist parsing) and `src/lib/admin-auth.ts` (`getStaffActor`, `requireStaffActor`, `requireAdmin` kept, now also returns `actorId`). Optional OIDC provider `staff-oidc`, enabled only when `ADMIN_OIDC_ISSUER/_CLIENT_ID/_CLIENT_SECRET` are set. Middleware and the 10 existing callers untouched.
- `19:20` **change** D2: `src/lib/forms/**` (registry, recipients, transport, `submitWebsiteForm`) and `src/app/api/forms/[formId]/route.ts` (200 sent / 422 invalid / 503 unavailable; 404 unknown form; 413 oversize; 429 rate limit; honeypot field `website`).
- `19:20` **decision** D1: `actorId` = `staff_` + first 32 hex of sha256(issuer NUL subject). Deterministic, so no database table or migration is needed yet; no Supabase files changed. Membership is the env allowlist `ADMIN_STAFF_ALLOWLIST` (JSON array of `{issuer, subject, email?}`), re-checked every request, so removal is immediate. Malformed JSON yields an empty list (fail closed).
- `19:20` **decision** D1: allowlist keys are issuer+subject, not email (per spec). Sign-in also requires `email_verified === true`. Consequence: staff subjects must be known before enrollment; discovering them is a provisioning step.
- `19:20` **decision** D1 transition: the shared `ADMIN_EMAIL` account resolves to one `legacy` actor (`legacy: true`) so current guards work. Cutover = set `ADMIN_LEGACY_SHARED_ACCOUNT=disabled`; rollback = unset it. Sessions issued before this change carry no identity and must sign in again.
- `19:20` **decision** D2: unknown formId returns `invalid` with `fieldErrors.form`. Recipient default is required from `FORMS_FEEDBACK_RECIPIENT` (no hardcoded fallback; `info@thrivevineyard.com` not used); extras from `FORMS_FEEDBACK_EXTRA_RECIPIENTS` (comma list), deduplicated case-insensitively. Any malformed address means `unavailable`, not partial delivery. Sender is `FORMS_MAIL_FROM`.
- `19:20` **decision** D2: no deployment transport exists (provider undecided). `FORMS_MAIL_TRANSPORT=fake` selects an in-memory transport and is refused when `NODE_ENV=production`; production therefore reports `unavailable`. Delivery failure and misconfiguration are both `unavailable` by design. Submitted text is never logged.
- `19:20` **note**: rate limit is per server instance (in memory); a platform-level limit is a deployment follow-up.
- `19:20` **request** ops: widen `vitest.config.ts` include to `src/**/*.test.ts`. Data tests live at `src/lib/admin-identities.test.ts` and `src/lib/forms/forms.test.ts` (tests/** is Ops-owned); `npm test` does not run them until then. I ran them with a temporary external config: 54 passed across 4 files.
- `19:20` **request** experience/ops: F1 shape for E1 is `POST /api/forms/feedback` JSON `{category:'bug'|'idea', message, replyEmail?, pagePath?, website?}`; `website` must stay empty (honeypot).
- `19:20` **blocker** owner: (1) OIDC provider and issuer, (2) each staff member's subject, (3) mail provider and verified sender, (4) feedback inbox and optional extras. Real transport is a follow-up ticket once chosen. Env vars above go in Preview first; none set here.
