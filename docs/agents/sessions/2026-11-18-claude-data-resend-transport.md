# Session log: claude/data-resend-transport

- Assignment: docs/agents/assignments/2026-11-18-development-kickoff.md (second batch, D3)
- Lane / tool: Data / Claude Code
- Base: claude/data-mvp-foundations (draft PR #15), stacked

## Status
D3 implemented; gate passes. Draft PR stacked on #15. No live Resend request made.

## Entries
- **decision** D3: Resend adapter uses fetch against POST https://api.resend.com/emails with Bearer auth; no package added. Body: from, to[], subject, text, optional reply_to. Success needs 2xx plus a nonempty string id.
- **decision** D3: Enabled only by FORMS_MAIL_TRANSPORT=resend and nonempty RESEND_API_KEY. Otherwise null (unavailable). Fake stays refused in production.
- **decision** D3: 8s abort timeout, no retry, no Idempotency-Key (a possibly-accepted send is never resent). Errors are generic strings with no text, recipients, or key.
- **note** D3: sender must be a Resend-verified domain; FORMS_MAIL_FROM is config only. resend.com/nextjs shows only onboarding@resend.dev for testing; nothing hardcoded.
- **change** D3: added src/lib/forms/resend.ts, resend.test.ts; transport.ts selects it. Forms tests 29 pass; full gate PASS.
- **note** D3: on this base vitest.config.mts includes only tests/**, so colocated src/lib/forms tests are not discovered by the repo config; ran them with a temp config outside the repo. PR #16 fixes discovery.
- **request** Ops: add RESEND_API_KEY, FORMS_MAIL_TRANSPORT=resend, FORMS_MAIL_FROM (verified-domain sender), FORMS_DEFAULT_RECIPIENT to .env.local.example and Vercel (secret) after Resend account and domain exist.
- **request** PM/docs: document env keys in docs/06-integrations.md; auth mail must use separate templates and rate limits.
