# Admin access setup

The first MVP admin account uses NextAuth credentials backed by a server-side scrypt hash. No account signup is exposed. Set these values in `.env.local` and in the deployment's server environment:

```text
NEXTAUTH_SECRET=<random secret>
NEXTAUTH_URL=<site origin>
ADMIN_EMAIL=<editor email>
ADMIN_PASSWORD_SCRYPT=<saltHex:hashHex>
```

In WSL, create the hash without entering the password in shell history:

```bash
read -rs -p 'Admin password: ' THRIVE_ADMIN_PASSWORD
printf '\n'
printf '%s' "$THRIVE_ADMIN_PASSWORD" | node scripts/make-admin-hash.mjs
unset THRIVE_ADMIN_PASSWORD
```

Copy the printed value to `ADMIN_PASSWORD_SCRYPT`. Use a unique password of at least 16 characters. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.

`/admin/login` accepts the configured email and password. Middleware protects `/admin/**` except the login page. The dashboard and CRUD pages still need implementation; successful sign-in currently unlocks their placeholder screens. Rotate the password by generating a new hash and updating the environment value.
