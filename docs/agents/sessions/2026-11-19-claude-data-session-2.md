# Session log: `claude/data-db-reconcile`

**Assignment:** `docs/agents/assignments/2026-11-19-session-2.md` · **Lane:** Data · **Tool:** claude · **Started:** 2026-11-19

## Status
Done: D0 checkpoints; D1 part 1 built on #101 (dba1926, 6308529, eab8fd3); PR body drafted.
Blocked: #101 write steps wait on owner decision card answers, backup confirmation, and two named "go" comments. Nothing written to the live database.
D2 #102 PR open (draft), awaiting Cursor QA

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
