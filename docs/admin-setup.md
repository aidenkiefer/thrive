# Admin access setup

The MVP uses individual one-time email codes. Supabase Auth sends and verifies a code for an owner-created Auth user; a service-only `admin_staff_accounts` row binds that user's UUID to a durable staff actor. NextAuth then issues the website session. There is no shared admin password, public staff signup, or OIDC fallback.

## Preview environment

Use an isolated Preview Supabase project and set these values for the Preview deployment:

```text
NEXTAUTH_SECRET=<random secret>
NEXTAUTH_URL=<Preview site origin>
NEXT_PUBLIC_SUPABASE_URL=<Preview Supabase project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Preview publishable key>
SUPABASE_SERVICE_ROLE_KEY=<Preview service role key, server only>
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` can replace the publishable key. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`. Keep the service role key and SMTP credentials out of Git and browser code. The obsolete `ADMIN_EMAIL`, `ADMIN_PASSWORD_SCRYPT`, `ADMIN_OIDC_*`, `ADMIN_STAFF_ALLOWLIST`, and `ADMIN_LEGACY_SHARED_ACCOUNT` settings have no effect.

## Provision staff and email codes

1. Apply `supabase/migrations/20261118000000_admin_staff_accounts.sql` to the isolated Preview project. Confirm RLS is enabled, no anon/authenticated policy exists, and the service role can read the table.
2. Disable public email signups in Supabase Auth. Configure its email OTP template to contain the code (`{{ .Token }}`), without a sign-in link. Confirm the configured code length is 6–10 digits and record its expiry. Configure a dedicated Resend SMTP credential for Supabase Auth; this is separate from the website forms API key.
3. Create each staff user in Supabase Auth through an owner-controlled enrollment path. Copy that user's Auth UUID into a membership row. For example, in the SQL editor after creating the Auth user:

   ```sql
   insert into admin_staff_accounts (email, auth_user_id)
   values ('person@example.org', '<Auth user UUID>');
   ```

   Use the staff member's actual normalized email and UUID. The insert is active by default. Disable a person with `update admin_staff_accounts set status = 'disabled' where actor_id = '<actor UUID>';`. A status change or Auth UUID rebind increments `auth_version` and revokes existing website sessions.
4. In Preview, verify one successful sign-in and the denial paths: unknown or disabled email, wrong/expired/replayed code, changed Auth UUID, changed auth version, and missing service-role configuration. Confirm requests and verification do not expose staff membership, codes, or Supabase tokens.

`/admin/login` requests the code, then verifies it. Middleware checks for a NextAuth token, and every protected server page or action rechecks active staff membership and version. Rotating `NEXTAUTH_SECRET` during the production cutover invalidates old shared-login cookies.

## Sessions and revocation

A website session lasts 4 hours from sign-in. Using the admin does not extend it; after 4 hours the person signs in again with a new code. To end a person's sessions sooner, revoke them in the SQL editor in one of two ways:

- Disable the row: `update admin_staff_accounts set status = 'disabled' where actor_id = '<actor UUID>';`. This blocks new sign-ins too.
- Keep the person active but end their current sessions: `update admin_staff_accounts set auth_version = auth_version + 1 where actor_id = '<actor UUID>';`.

The next protected request after either change rejects the old session. Rows are never deleted or truncated; the database refuses both so revision attribution survives.

## Release gate: shared rate limiting

The current request-code and code-verification limits in `src/lib/admin-identities.ts` use process-local memory. They reset on cold starts and do not aggregate across Vercel instances. Supabase Auth has separate provider limits, but they do not establish the website's stated per-client and per-email budgets. **Do not promote staff sign-in to production until a shared, durable limiter (or equivalent trusted platform limits) covers both endpoints across instances and the limits are verified in Preview.** The Preview exercise should include repeated requests across fresh instances and a check that legitimate staff can still receive and verify codes. This is an implementation/release gate, separate from the Preview account, migration, SMTP, and sender provisioning above.
