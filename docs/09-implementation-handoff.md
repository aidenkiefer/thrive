# Thrive Website MVP — Implementation Handoff

**Date:** November 7, 2026
**Branch:** codex/mvp-foundation-2026-11-06
**Review target:** PR into main; this request does not authorize merging.
**MVP target:** November 13, 2026.
**Deferred:** current-site copy and content migration.

## Status at pause

This branch is a substantial MVP foundation and a reviewable stopping point, not a launch-ready release. It contains the Next.js/Supabase app foundation, canonical content records, protected admin editors, refreshed export preparation, public event/sermon and other entity routes, and core SEO/calendar behavior. The ministry detail and admin editing surface are the last feature addition in this checkpoint.

Canonical entity rule: ministry, event, sermon, group, outreach, announcement, staff, and campaign facts should live once in their records and be reused by public surfaces. Do not duplicate facts as independent page content. ChurchSuite remains forms-only; do not add API calls or synchronization. Never invent missing church data.

## Work completed on the feature branch

- App Router, Supabase server-side access helpers, schema, query modules, and a guarded data seeding command.
- Refreshed WordPress WXR and MEC JSON exports, conversion and reporting workflow, parsed migration outputs, and guarded seed preparation. Reviewed source coverage: 120 published sermon records and 80 published events. Recurrence parsing reports 43 occurrences across eight recurring event records. Express(o) is explicitly held for editorial schedule review.
- Credential-based NextAuth sign-in with server-side scrypt verification, protected admin routes, and setup documentation.
- Admin create/edit/publish forms for announcements, sermons, one-time events, recurring events and occurrences, ministries, groups, outreach, staff profiles, and campaign landing pages; admin navigation and sign-out.
- Public routes backed by published canonical records for events, sermons, groups, outreach, ministries, and campaign landing pages, where implemented.
- Event archive month and grid/list controls, event detail support including external destination links, Chicago-local event labels, and downloadable iCalendar at /events/calendar.
- SEO foundations including legacy redirects, sitemap, robots behavior, and dynamic content URLs.
- MVP status and roadmap in docs/08-mvp-status-roadmap.md; account setup in docs/admin-setup.md; this handoff in docs/09-implementation-handoff.md.

Feature history includes commits 5da5ab5, b36b2e8, bde27a9, 55a827f, d679a60, cdac650, e9e4fc6, 70c7a79, 045b576, 1c72218, 990b976, and 5b490f6. The ministry feature and handoff updates are the current uncommitted work before the final checkpoint commit.

## Validation and limits

- Final PR checkpoint verified: npm ci followed by npm run build from the repository root completed successfully on November 7, 2026, after correcting the ministry route syntax. Next.js compiled, type-checked, generated all 28 static pages, and finalized the production build.
- Prior builds emitted an Edge Runtime warning involving Supabase process.version via middleware and npm audit reported 9 moderate, 7 high, and 2 critical dependency findings. These were not build failures and have not been represented as fixed.
- The seed has not been run against Supabase. Remote schema application and database contents are unverified. A successful build does not validate database connectivity or imported data.
- No admin login, browser acceptance, accessibility review, or production deployment has been verified in this checkpoint.
- Vercel Preview requires its own environment values, including NEXTAUTH_SECRET, NEXTAUTH_URL, ADMIN_EMAIL, ADMIN_PASSWORD_SCRYPT, and the needed Supabase URL/key settings. Treat missing Preview configuration separately from compilation failures.
- AGENTS.md now mandates npm ci followed by npm run build before every push, a clean status review, and pushing only intended committed changes.

## Remaining work, prioritized

1. Review the PR diff and build result. Confirm the PR targets main and contains only intended committed work; do not merge until approved.
2. Confirm the intended Supabase project. Review schema changes, policies, and migration impact. Apply schema in a controlled environment before any import.
3. Review the import report against all 80 events and 120 published sermons, inspect representative rows and media/link coverage, validate timezone and recurrence behavior, and resolve the Express(o) schedule exception with an authoritative source.
4. Configure Vercel Preview variables and verify sign-in, protected-route behavior, and admin edits using non-production data.
5. Verify visitor essentials and forms from current approved sources: visitor/about/contact/giving paths, signup destinations, and ownership. Current WXR is sermon-focused and is not a complete page-copy export. Preserve ChurchSuite's forms-only role.
6. Reconcile redirects and canonical metadata against current Search Console data and active Ads destinations; review sitemap coverage and legacy URL outcomes.
7. Resume the explicitly deferred copy/content migration using current approved copy and images. Map content to canonical records so facts remain single-source; review each migrated page against the live site.
8. Complete release checks for desktop/mobile layouts, keyboard access, empty/error states, forms, tracking, production configuration, domain, rollback, and church content approval.

## Known gaps and constraints

- Page copy/design migration is deferred until this foundation checkpoint is reviewed.
- The refreshed WXR contains sermon posts and media attachments, not the full current page inventory.
- Database seed and remote schema changes have not been executed or verified.
- Recurrence exceptions and source media/link mappings need human review.
- Forms, analytics, active Ads URLs, and final redirect coverage need confirmation from current organizational sources.
- This branch is not merged; PR review is the intended pause boundary.

## Useful references

- docs/08-mvp-status-roadmap.md — evidence-based status and MVP sequencing
- docs/admin-setup.md — admin credentials and environment setup
- docs/03-information-architecture.md and docs/05-content-models.md — canonical architecture
- docs/06-integrations.md — integration constraints
- migration-files/README.md and migration-files/parse-current-exports.py — migration workflow
- supabase/schema.sql — schema
- docs/plans/PROGRESS.md — progress log
