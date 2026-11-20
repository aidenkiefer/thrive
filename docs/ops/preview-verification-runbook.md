# Protected Preview verification · #41

Use this checklist on Cursor's combined candidate. The protected Preview uses the **production Supabase project until launch**. All hosted results start **NOT RUN**. The owner privately confirms the exact deployment, deployed SHA, database target, Vercel Authentication, branch-scoped credentials, test account and sandbox mail routing. Ops handles no credentials and performs no sign-ins or sends. An unauthenticated private browser should stop at Vercel Authentication. Verify the selected deployment SHA in Vercel after authenticating.

[Acceptance checklist](https://github.com/aidenkiefer/thrive/issues/41#issuecomment-7001687033) · [Limiter #23](https://github.com/aidenkiefer/thrive/pull/23) · [Local rehearsal #95](https://github.com/aidenkiefer/thrive/pull/95) · [Sandbox sender #103](https://github.com/aidenkiefer/thrive/issues/103) · [Live project rules](supabase-live-project.md)

## Pin the inputs and rehearse locally

Run in the clean combined candidate checkout. Record the full SHA and file hashes. Expected branch `cursor/qa-preview-candidate`, clean status and these seven migration basenames in order. Stop on drift and have QA repin the reviewed inputs.

```sh
git branch --show-current
git rev-parse HEAD
git status --porcelain
LC_ALL=C find supabase/migrations -maxdepth 1 -name '*.sql' -type f | LC_ALL=C sort | xargs sha256sum
```

```text
20261107000000_mvp_foundation.sql
20261107010000_ministry_schedule_forms.sql
20261107020000_contact_column_privacy.sql
20261118000000_admin_staff_accounts.sql
20261118010000_shared_rate_limit.sql
20261119000000_publication_events.sql
20261119010000_published_at_guard.sql
```

Use an isolated local checkout without project credentials. The #95 harness at `f054310` covered five files through the limiter. Cursor must include the reviewed harness and both CMS files on the combined SHA before taking this result.

```sh
cd scripts/pg-rehearsal
npm ci
node rehearse-pg.mjs ../..
```

Expected exit 0, all three scenarios pass, summary ends in `0 failed`. Inspect the output for **all seven** files. The harness discovers the sorted migrations at the supplied root. On fresh embedded PostgreSQL it applies schema.sql, expects “already exists” on the second schema load, then applies the whole migration chain twice. For legacy it reads `git show cd012bd:supabase/schema.sql` into memory and also tests its first 304 lines without the patch block. Each legacy case applies each file twice consecutively, then the full chain again. A local pass supplies no hosted HTTP evidence.

## Hosted inspection · read-only

Use Supabase MCP `list_migrations` with `{}` and compare names and actual versions to the [ledger](supabase-change-ledger.md). The November 19 baseline had the three November 7 files only. Recheck before every change. Run the following SELECTs through `execute_sql`. They read metadata and counts only.

```sql
SELECT to_regclass('public.rate_limit_buckets') AS buckets,
       to_regprocedure('public.take_rate_limit(text,text,integer,integer)') AS take_rpc,
       to_regprocedure('public.prune_rate_limit_buckets(integer)') AS prune_rpc;
```

Expect three NULLs before the limiter migration and three named objects afterward. Defer the following privilege check until all three exist.

```sql
SELECT has_table_privilege('anon','public.rate_limit_buckets','select') AS anon_bucket_read,
       has_table_privilege('authenticated','public.rate_limit_buckets','select') AS auth_bucket_read,
       has_function_privilege('anon','public.take_rate_limit(text,text,integer,integer)','execute') AS anon_take,
       has_function_privilege('authenticated','public.take_rate_limit(text,text,integer,integer)','execute') AS auth_take,
       has_function_privilege('anon','public.prune_rate_limit_buckets(integer)','execute') AS anon_prune;
```

Expect one row, five false. Check contacts, RLS, policies and Storage bucket metadata independently.

```sql
SELECT r, t, c, has_column_privilege(r,t,c,'SELECT') AS readable
FROM (VALUES ('anon'::name),('authenticated'::name)) roles(r)
CROSS JOIN (VALUES ('public.speakers','email'),('public.staff','email'),('public.staff','phone')) cols(t,c);
SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p') ORDER BY 1;
SELECT tablename, policyname, roles, cmd, qual FROM pg_policies WHERE schemaname='public' ORDER BY 1,2;
SELECT count(*) AS storage_buckets FROM storage.buckets;
SELECT to_regclass('public.admin_staff_accounts') AS staff_roster;
```

Expect six false contact grants and RLS enabled on all application tables. Compare policy predicates to the pinned schema, including publication filters and event occurrences' parent check. No public staff-account or limiter-bucket policy should expose rows. The baseline had zero Storage buckets. Once the roster exists, `SELECT count(*) FROM public.admin_staff_accounts;` should match the owner's expected enrollment count. Never query auth.users or contact values. In an **actual anon-role** owner-controlled query context, `SELECT current_user, count(*) FROM public.sermons WHERE published_at IS NULL;` expects `anon, 0`. A privileged query cannot prove anonymous visibility.

## Hosted changes · OWNER / CLAUDE ONLY · NOT RUN

For **every** hosted mutation below, including a replay, limiter batch, OTP request, account fixture change or form send, first obtain the owner's go on the relevant issue naming the pinned artifact, scope and side effects, then backup confirmation for that change. Claude/Data is the sole agent executor of database writes. Only the owner operates authenticated UI, holds private credentials, and runs credentialed HTTP checks. Data appends a [ledger row](supabase-change-ledger.md) with UTC, executor, artifact/SHA, actual migration version where applicable, verification and result. Ops and QA observe redacted evidence. Stop on missing prerequisites.

**Migration apply/replay · Claude only.** For each approved missing file in order, use Supabase MCP `apply_migration` with `{"name":"<reviewed migration name>","query":"<exact entire pinned SQL file>"}`. Obtain the input with `git show "$CANDIDATE_SHA:supabase/migrations/$FILE"`, using the verified SHA and approved filename. Expect success, then `list_migrations {}` and the reviewed catalog shape. Record the actual assigned version. A separately approved second application must also succeed with the same catalog shape and existing data preserved. Record both versions. The first three migrations already landed. Use the local double replay for them unless the owner specifically approves each hosted replay. Never run a blanket db push, schema reload or down migration. Apply publication events **before deploying #90 code**. Deploy and confirm #96 code live **before applying its guard**. If the combined deployment would break this order, stop for staged deployments.

**Hosted HTTP serialization · owner only, live write.** The VOLATILE take RPC changes a synthetic bucket, caps hits at limit + 1 and can prune up to 25 expired buckets. Even SQL SELECT of this function writes. Use an owner terminal with Python 3, an accurate clock, the approved Supabase origin and a service-role key entered privately. This uses 50 simultaneous calls with one random 64-hex subject. Do not use staff-code or feedback endpoints for concurrency.

```sh
python3 - <<'PY'
import concurrent.futures as cf
import getpass, json, re, secrets, sys, threading, time
import urllib.error, urllib.parse, urllib.request
from collections import Counter

with open('/dev/tty') as tty:
    print('Approved HTTPS Supabase origin: ', end='', flush=True)
    origin = tty.readline().strip().rstrip('/')
if not re.fullmatch(r'https://[a-z0-9-]+\.supabase\.co', origin):
    sys.exit('STOP: expected approved Supabase HTTPS origin')
key = getpass.getpass('Service-role key: ')
subject = secrets.token_hex(32)
body = json.dumps(dict(p_purpose='verify.http', p_subject_hash=subject,
                       p_limit=3, p_window_seconds=60)).encode()
barrier = threading.Barrier(51)
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None
def take(_):
    client = urllib.request.build_opener(NoRedirect(), urllib.request.ProxyHandler({}))
    req = urllib.request.Request(origin + '/rest/v1/rpc/take_rate_limit', data=body,
          headers={'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    barrier.wait(timeout=30)
    try:
        with client.open(req, timeout=25) as resp:
            status = resp.status
            rows = json.load(resp)
        if not isinstance(rows,list) or len(rows)!=1:
            return status, 'invalid', None
        a, r = rows[0]['allowed'], rows[0]['retry_after_seconds']
        if type(a) is not bool or type(r) is not int or not (r==0 if a else 1<=r<=60):
            return status, 'invalid', None
        return status, 'allowed' if a else 'denied', r
    except urllib.error.HTTPError as e:
        return e.code, 'error', None
    except Exception:
        return 'error', 'error', None

if time.time()%60 > 25:
    time.sleep(61-time.time()%60)
with cf.ThreadPoolExecutor(max_workers=50) as pool:
    futures = [pool.submit(take,i) for i in range(50)]
    start = time.time()
    if 60-start%60 < 30:
        barrier.abort()
        sys.exit('INCONCLUSIVE: insufficient window; no batch released')
    barrier.wait(timeout=30)
    results = [f.result() for f in futures]
end = time.time()
statuses = Counter(s for s,_,_ in results)
counts = Counter(d for _,d,_ in results)
retry = [r for _,d,r in results if d=='denied']
print('HTTP',dict(statuses),'decisions',dict(counts),'denied retry range',
      (min(retry),max(retry)) if retry else None,'seconds',round(end-start,2))
if int(start//60)!=int(end//60):
    sys.exit('INCONCLUSIVE: window crossed')
if statuses!={200:50} or counts!={'allowed':3,'denied':47}:
    sys.exit('FAIL')
print('PASS')
PY
```

Expected HTTP 200 × 50, three allowed with retry 0 and 47 denied with retry 1–60 in one window. A crossed window requires a new approval window and fresh subject before another batch. No automatic retries. Preserve only aggregate results.

**Staff code · owner only, live writes and sandbox sends.** Use the authorized browser at `/admin/login`, in a clean session. Type the existing enrolled sandbox account and code privately. Inspect only status and Retry-After, never export network traces. Use NextAuth's staff-code UI for all verifications. Confirm a protected admin page opens, sign out, then confirm the protected page requires login again.

| Owner action | Expected result |
|---|---|
| Request one code with the enrolled fixture | POST /api/admin-login/request-code returns generic 200 accepted. Exactly one sandbox message arrives. |
| Use a wrong code, an expired code after the configured TTL, and a previously accepted code in separate clean sessions | Each verification denies access. Use fresh fixture codes for independent cases. |
| Request using an owner-controlled unenrolled sandbox fixture | Same generic 200, no message, no roster disclosure. |
| Using individually approved disabled and identity-rebound sandbox fixtures, attempt sign-in | Denied for the disabled account and mismatched bound identity. Data needs separate fixture-change approval, backup and ledger. Check existing-session revocation only if the pinned candidate implements it. |
| Check request and verify limits against candidate tests | Request IP 10/900s, email 3/900s, global 60/3600s. Email suppression keeps generic 200. Exhausted IP/global gives 429 with Retry-After. Verify IP 30/900s, email 8/900s, access denied when capped. Limiter outage on request gives 503 with Retry-After 60. Do not exhaust shared production budgets to elicit these results. Mark hosted negatives unverified unless isolated and approved. |

**Feedback · owner only, live writes and sandbox sends.** Owner confirms the default inbox, per-form override and every extra recipient privately resolve to approved sandbox destinations before submitting. In the authorized browser on `/feedback`, run this in DevTools on the selected origin. Invoke one case at a time within its approval. The helper prints only status and retry delay.

```js
const fixture = {category:'bug', message:'Preview verification fixture', replyEmail:'', pagePath:'/feedback', website:''}
async function postFeedback(body) {
  const r = await fetch('/api/forms/feedback', {method:'POST', headers:{'Content-Type':'application/json'}, body})
  console.log(r.status, r.headers.get('Retry-After'))
}
await postFeedback('{')                                      // 400
await postFeedback(JSON.stringify({...fixture,message:''}))  // 422
await postFeedback('x'.repeat(16001))                        // 413
await postFeedback(JSON.stringify({...fixture,website:'bot'})) // 200, no delivery
await postFeedback(JSON.stringify(fixture))                  // 200, sandbox delivery
```

Confirm exactly the approved sandbox recipients receive the fixture, no other delivery, and the candidate submission path stores no submitted content (inspect `src/lib/forms/submit.ts`, never inbox contents or submission rows in evidence). The first five valid requests per form/client in 600 seconds can send; a sixth returns 429 and Retry-After. Only exercise that sequence with separate approval for all five sends in a fresh window. Limiter outage gives 503 and Retry-After 60; delivery failure gives 503. Do not change shared credentials to force either failure.

To check text retention without sending, open `/feedback` and intercept only the current browser tab's submit request in DevTools. Run the following, type the fixture into the form and submit. Expect a retry/error message and the original text still present. Restore fetch immediately. This tests the UI only; record actual hosted outage or delivery-failure behavior separately as unverified unless safely observed.

```js
const originalFetch = window.fetch
window.fetch = (input, init) => new URL(input instanceof Request ? input.url : input, location.href).pathname === '/api/forms/feedback'
  ? Promise.resolve(new Response('{"status":"unavailable"}',{status:503,headers:{'Content-Type':'application/json'}}))
  : originalFetch.call(window,input,init)
 // After observing the UI:
 // window.fetch = originalFetch
```

## Record and release

| Check | Status | UTC / SHA | Redacted observation or blocker | Verifier |
|---|---|---|---|---|
| Protected deployment and migration manifest | NOT RUN | | | |
| Fresh and both legacy local double replays | NOT RUN | | | |
| Hosted ledger, RLS, privacy, five grants | NOT RUN | | | |
| Approved migration applications/replays and code order | NOT RUN | | | |
| 50 HTTP decisions, retry range and duration | NOT RUN | | | |
| Staff session, rejection and throttle cases | NOT RUN | | | |
| Feedback delivery, non-delivery and retained text | NOT RUN | | | |
| Independent Cursor QA verdict per Data PR | PENDING | | | |
| Owner go per Data PR on its issue | PENDING | | | |

Record PASS, FAIL, INCONCLUSIVE or NOT RUN for each subcase. Link issue approvals and ledger rows. Include counts only, with no addresses, project identifiers, URLs containing credentials, keys, codes, connection strings, inbox captures or raw headers. Cursor records remaining evidence and decides MERGE/FIX-FIRST/BLOCK per PR. Each Data PR still requires its own explicit owner go.
