# Session log: `claude/data-db-reconcile`

**Assignment:** `docs/agents/assignments/2026-11-19-session-2.md` · **Lane:** Data · **Tool:** claude · **Started:** 2026-11-19

## Status
Done: D0 checkpoints; D1 part 1 built on #101 (dba1926, 6308529, eab8fd3); PR body drafted.
Blocked: #101 write steps wait on owner decision card answers, backup confirmation, and two named "go" comments. Nothing written to the live database.
D2 #102 PR #114: Cursor QA MERGE (21:29Z), stays draft until the owner says go on #102
D1 #108: QA delta should-fixes fixed, re-review pending

## Entries
<!-- Append-only, oldest first. Types: decision · change · blocker · request · note -->
- `14:13` **change** D0 #23: N-A fixed in src/lib/admin-identities.ts (PII-free `[staff-code] send_failed` / `verify_error` via injected `log`, default console.error) + 2 tests (T1, opus) [a235efa]
- `14:13` **change** D0 #15 #18 #23 #90 #96 #95: docs/admin-setup.md "isolated Preview project" -> "the production project, before launch" on #15, carried forward by merge commits, no force pushes (T1, opus) [4c56611]
- `14:13` **change** D0 #23 and #96: #23 rewords its two limiter apply lines; #96 adds a "Seeding" section (never re-seed a database with staff edits) (T1, opus) [cff24ac]
- `14:13` **change** D0 #15 and #96: PR bodies refreshed. Gates PASS: #15 129 tests, #18 145, #23 252, #90 167, #96 183, #95 pending (T1, opus)
- `14:13` **change** D1 part 1 #101: read-only reconciliation via `npm run seed -- --dry-run` (publishable key) + MCP SELECT counts; report in docs/ops/db-reconciliation-2026-11-19.md (T2 design, T1 build, opus) [dba1926]
- `14:13` **change** D1 part 1 #101: seed rails in scripts/seed-current.ts, pure logic in src/lib/seed/{plan,diff}.ts (29 tests); guide docs/ops/seeding-preview.md; nothing written to the live database (T1, opus) [6308529] [eab8fd3]
- `14:13` **change** D1 part 1 #101: decision card posted on #101 (https://github.com/aidenkiefer/thrive/issues/101#issuecomment-7020958872) (T2, opus)
- `14:13` **decision** pure seed logic lives in src/lib/seed/ (Data-owned, inside the vitest include globs), not scripts/ (outside the test globs) or tests/** (Ops-owned) (T2, opus)
- `14:13` **decision** dry run uses the publishable key, never the service-role key. Public read policy is `published_at is not null` and all live content rows are published, so it sees every row (T2, opus)
- `14:13` **note** live has no expresso-service recurring event. Stale one-time `thrive-youth-thursday-nights` would shadow the planned recurring event of the same slug (getEventBySlug reads one_time first), so the writer refuses while that collision is published (T1, opus)
- `14:13` **blocker** #101 write steps wait on the owner's decision card answers, backup confirmation, and two named "go" comments. Recommended: unpublish the announcement, the five hand-written rows and the stale one-time event; keep the 8 past occurrences; owner runs `npm run seed`
- `14:13` **request** lane ops (#30 hygiene): may delete legacy scripts/seed-from-parsed.ts. #39 listed it out of scope, so D1 leaves it
- `14:37` **note**: PR #108 opened (draft), QA-READY posted. Board: #101 Waiting on owner; #39 and #23 In review; #102 In progress, then In review.
- `14:37` **note**: gh posts as the owner's account, so agent comments appear authored by aidenkiefer. An owner "go" is only valid from a comment the agent did not post.
- `14:37` **decision** #102: role lives on the row and is re-read on every request (StaffActor.role), not in the JWT, so a role change applies immediately and the JWT stays {actorId, authUserId, authVersion}; unknown role = treated as disabled (fail closed). (T2, opus)
- `14:37` **decision** #102: last-admin rule in the guard trigger, serialized with pg_advisory_xact_lock; inserts never checked so bootstrapping works. (T2, opus)
- `14:37` **decision** #102: stacked on claude/data-pg-rehearsal (#95, the tip of the #23 chain) instead of #23 itself, so the real-Postgres harness the issue requires is on the branch.
- `14:37` **change** #102 (T1, opus) [289f646, f4d59d3]: migration 20261119020000_admin_staff_roles.sql, schema.sql mirror, src/lib/admin-permissions.ts (`can`, `parseStaffRole`), `requirePermission` + `PermissionDeniedError` in admin-auth.ts, role SQL in docs/admin-setup.md, rehearsals PGlite 448/448 and real Postgres 641/641 incl. two-connection race; last-admin mutant 430/448 exit 1; gate PASS 262 tests.
- `15:45` **change** #108 QA delta FIX-FIRST (Gemini re-check, 21:14Z): all three should-fixes and three nits. Fingerprint binds planned rows (new `d4eadaaef3a98045`, replaces `3af3b89a403b72ac`), `writeRefusal` helper, confirmations CLI-only, parity + multi-column tests, single-writer doc. Mutants: 4/4 killed. Gate PASS, 135 tests. (T1, opus) [7cb0ab4]
- `15:45` **note** #101: the earlier go named no commit; the go now has to name the new commit and fingerprint `d4eadaaef3a98045`. Batch A SQL is unchanged since 9ba802e. Pagination nit (PostgREST 1000-row cap) left as is: largest table is 120 rows.
- `16:10` **decision** owner (chat, 2026-11-19): no pre-write backup, because the live data is placeholder. The first backup will be taken once the database is prod-ready (#118). The seed runs as generated SQL through the MCP (option b).
- `16:10` **change** #101 seed as SQL: src/lib/seed/sql.ts, scripts/seed-sql.ts, supabase/ops/2026-11-19-seed.sql, staleness test; PGlite rehearsal 7/7; gate PASS 139 tests (T1, opus) [a2add8e]
- `16:10` **blocker** #101 apply waits on the owner's go comment naming batch A and the seed SQL at the commit (rule 3.1: a go in chat isn't enough).
- `17:30` **change** #101 applied under the owner's go for 511dd88: batch A (one transaction, verification queries pass), then the seed via MCP in 13 row-chunked upserts. Final read-only dry run: all 6 tables 0 insert / 0 update, Express(o) Sundays 8:30 AM, 8 past occurrences kept. Results: https://github.com/aidenkiefer/thrive/issues/101 (T1, opus)
- `17:30` **note** MCP execute_sql is inline-only, so a large seed has to be sent as text. Hand-copying drops U+00A0 (18 descriptions) and risks typos (1 timestamp); the dry run diff caught both. Next time, escape invisible characters in the generated SQL (or make sql.ts do it) and verify per table.
