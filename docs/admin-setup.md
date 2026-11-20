# Admin access setup

The MVP uses individual one-time email codes. Supabase Auth sends and verifies a code for an owner-created Auth user; a service-only `admin_staff_accounts` row binds that user's UUID to a durable staff actor. NextAuth then issues the website session. There is no shared admin password, public staff signup, or OIDC fallback.

## Preview environment

Use the production project, before launch (there is no separate Preview project; rules in `docs/ops/supabase-live-project.md`), and set these values for the Preview deployment:

```text
NEXTAUTH_SECRET=<random secret>
NEXTAUTH_URL=<Preview site origin>
NEXT_PUBLIC_SUPABASE_URL=<Preview Supabase project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Preview publishable key>
SUPABASE_SERVICE_ROLE_KEY=<Preview service role key, server only>
RATE_LIMIT_HASH_SECRET=<dedicated random secret, 32+ chars, server only>
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` can replace the publishable key. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`. Generate `RATE_LIMIT_HASH_SECRET` the same way, as a separate value for each environment. Never reuse `NEXTAUTH_SECRET` for it. If it is missing or shorter than 32 characters, code requests, code verification, and form submissions are all refused. Keep the service role key and SMTP credentials out of Git and browser code. The obsolete `ADMIN_EMAIL`, `ADMIN_PASSWORD_SCRYPT`, `ADMIN_OIDC_*`, `ADMIN_STAFF_ALLOWLIST`, and `ADMIN_LEGACY_SHARED_ACCOUNT` settings have no effect.

## Provision staff and email codes

1. Apply `supabase/migrations/20261118000000_admin_staff_accounts.sql` and `supabase/migrations/20261118010000_shared_rate_limit.sql` to the production project, before launch. Confirm RLS is enabled, no anon/authenticated policy exists, and the service role can read the staff table. The limiter migration is safe to run twice. Run its checks under [Release gate](#release-gate-shared-rate-limiting). Then apply `supabase/migrations/20261119020000_admin_staff_roles.sql` (roles, below) **before** deploying the code that reads `role`: without the column every staff lookup fails closed.
2. Disable public email signups in Supabase Auth. Configure its email OTP template to contain the code (`{{ .Token }}`), without a sign-in link. Confirm the configured code length is 6–10 digits and record its expiry. Configure a dedicated Resend SMTP credential for Supabase Auth; this is separate from the website forms API key.
3. Create each staff user in Supabase Auth through an owner-controlled enrollment path. Copy that user's Auth UUID into a membership row. For example, in the SQL editor after creating the Auth user:

   ```sql
   -- The owner, first (the only admin for now):
   insert into admin_staff_accounts (email, auth_user_id, role)
   values ('owner@example.org', '<Auth user UUID>', 'admin');

   -- Every other staff member (role defaults to 'staff'):
   insert into admin_staff_accounts (email, auth_user_id)
   values ('person@example.org', '<Auth user UUID>');
   ```

   Use the staff member's actual normalized email and UUID. The insert is active by default. Disable a person with `update admin_staff_accounts set status = 'disabled' where actor_id = '<actor UUID>';`. A status change, Auth UUID rebind, or role change increments `auth_version` and revokes existing website sessions.
4. In Preview, verify one successful sign-in and the denial paths: unknown or disabled email, wrong/expired/replayed code, changed Auth UUID, changed auth version, and missing service-role configuration. Confirm requests and verification do not expose staff membership, codes, or Supabase tokens.

`/admin/login` requests the code, then verifies it. Middleware checks for a NextAuth token, and every protected server page or action rechecks active staff membership and version. Rotating `NEXTAUTH_SECRET` during the production cutover invalidates old shared-login cookies.

## Roles

Each account is `admin` or `staff` (default). Staff account control (create, disable, re-enable, rebind, change a role) is **admin-only**; for now the owner is the only admin (decision 2026-11-19, #102). Every active account can edit content. The website interprets roles only in `src/lib/admin-permissions.ts`, reading the role from the account row on every request, so a change applies at once; an unknown role is treated like a disabled account.

- Make someone an admin: `update admin_staff_accounts set role = 'admin' where actor_id = '<actor UUID>';`
- Back to staff: `update admin_staff_accounts set role = 'staff' where actor_id = '<actor UUID>';`
- The database refuses to demote or disable the **last active admin**. Promote a second admin first.
- Account control is SQL in the editor for the MVP; there is no account-management screen yet.

## Seeding

Seed once, before staff start editing. **Never re-seed a database with staff edits:** once the `published_at` guard (`20261119010000`) is applied, the seed aborts with `P0001` at the first row whose `published_at` a staff member changed, and rows staff edited would otherwise be overwritten. Reconcile with a reviewed, row-by-row change instead (#101).

## Sessions and revocation

A website session lasts 4 hours from sign-in. Using the admin does not extend it; after 4 hours the person signs in again with a new code. To end a person's sessions sooner, revoke them in the SQL editor in one of two ways:

- Disable the row: `update admin_staff_accounts set status = 'disabled' where actor_id = '<actor UUID>';`. This blocks new sign-ins too.
- Keep the person active but end their current sessions: `update admin_staff_accounts set auth_version = auth_version + 1 where actor_id = '<actor UUID>';`.

The next protected request after either change rejects the old session. Rows are never deleted or truncated; the database refuses both so revision attribution survives.

## Release gate: shared rate limiting

Request-code, code-verification, and native form limits are counted in Postgres (`public.take_rate_limit`, service role only), so every Vercel instance shares one budget. Only an HMAC of the email or client address is stored. The limiter **fails closed**: a missing `RATE_LIMIT_HASH_SECRET` or Supabase configuration, a database error, or a timeout over 2 seconds refuses the request. Code requests and form submissions answer 503 with `Retry-After: 60`. Code verification fails the same way a wrong code does. Each failure logs one line, `[rate-limit] unavailable code=<not_configured|invalid_input|rpc_error|timeout> purpose=<purpose>`, which never includes the email or address. Client addresses come from the first `x-forwarded-for` hop. That is safe on Vercel, which sets the header itself. Revisit it before moving hosts.

**Do not promote staff sign-in or the native form to production until this Preview checklist passes:**

1. **Env:** set `RATE_LIMIT_HASH_SECRET` (above). The limiter also uses `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
2. **Apply:** run `supabase/migrations/20261118010000_shared_rate_limit.sql` on the isolated Preview database only, after the staff-accounts migration. Run it a second time to confirm it is idempotent.
3. **Verify in the Preview SQL editor** (repeat the privilege query after the second run):

   ```sql
   select has_table_privilege('anon', 'public.rate_limit_buckets', 'select'),
          has_table_privilege('authenticated', 'public.rate_limit_buckets', 'select'),
          has_function_privilege('anon', 'public.take_rate_limit(text,text,integer,integer)', 'execute'),
          has_function_privilege('authenticated', 'public.take_rate_limit(text,text,integer,integer)', 'execute'),
          has_function_privilege('anon', 'public.prune_rate_limit_buckets(integer)', 'execute');  -- all false
   select * from public.take_rate_limit('verify.test', repeat('a', 64), 2, 60);  -- run 3 times: true, true, false (+retry)
   delete from public.rate_limit_buckets where purpose = 'verify.test';
   ```

4. **Optional concurrency check:** 50 parallel calls with limit 3 must allow exactly 3.
5. **End to end:** repeated code requests from one address across fresh instances reach the 429. Legitimate staff can still receive and verify a code. Removing `RATE_LIMIT_HASH_SECRET` produces a 503 and a `code=not_configured` log line.

**Rollback:** counters are disposable. `drop function if exists public.take_rate_limit(text, text, integer, integer); drop function if exists public.prune_rate_limit_buckets(integer); drop table if exists public.rate_limit_buckets;` Revert the app commit at the same time, or every limited path will deny.
