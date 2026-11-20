# Decision: legacy Cursor Pro routing (2026-11-20)

Applied in `model-routing.md`, `roles-and-lanes.md` §5, `workflow.md` rule 4, and `.cursor/rules/00-core.mdc`. This file records what we adopted from the Gemini notes and what was already true. An earlier draft of this note assumed Cursor Plus. The owner is on **legacy Cursor Pro** ($20/mo).

Source: [Legacy Cursor plans](https://cursor.com/docs/account/pricing/legacy-cursor-plans), read 2026-11-20. Pro has two monthly pools, Cursor Models and Other Models. Both reset with the billing cycle. Fast mode and third-party models are available. Named third-party subagents draw Other Models even when the parent chat is Grok or Composer. The docs do not publish a dollar size for either pool.

## Adopted

- Cursor experience work defaults to Composer 2.5 and Grok 4.7. Fast mode stays off. One new Cursor chat per ticket.
- Claude, GPT, and Gemini inside Cursor are rare. One layout bug that Grok 4.7 already missed may use Gemini 3.1 Pro. Sonnet and Opus stay in Claude Code.
- Planning, schema, auth, and review stay on the Claude Code and Codex subscriptions.

## Already true, so no second copy in AGENTS.md

- Single writer for hot files. Ops owns `package.json` and `tsconfig.json`. Data owns `src/lib/supabase/types.ts` and `src/middleware.ts`. There is no `src/lib/db/types.ts`.
- Agents already use `claude/*`, `cursor/*`, and `codex/*` branches. `main` deploys to production. Vercel builds a Preview per pull request. Senior QA squash-merges after the owner says go.
- Data already owns `src/app/admin/**` and `src/components/admin/**`, including the login form.
- Staff sign-in is a 6-digit code. The Magic Link template sends `{{ .Token }}` and not a confirmation link. Email scanners cannot spend a code by prefetching a URL.

## Deferred ops ticket

Add an ESLint `no-restricted-imports` error, in its own config block, for `src/app/**` and `src/components/**` importing `@supabase/supabase-js` or `@supabase/ssr`. Leave `src/lib/**` and `scripts/**` alone. Those files are the allowed SDK boundary. The current flat config downgrades recommended errors to warnings, and warnings do not fail `npm run lint`, so this rule has to be a real error or the gate will not catch it. Do not ban `@/lib/supabase/server` in Server Components.
