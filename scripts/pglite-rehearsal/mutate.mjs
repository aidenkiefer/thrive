// Build a mutated copy of supabase/ to prove the rehearsal can fail.
// Usage: node mutate.mjs <repo-root> <out-dir> <revoke|cap|staff-truncate|last-admin>
// then: node rehearse.mjs <out-dir>   # must exit 1
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const [repo, out, kind] = process.argv.slice(2);
const mutations = {
  revoke: [/revoke all on table public\.rate_limit_buckets from anon;/g, '-- mutated'],
  cap: [/least\(b\.hits \+ 1, p_limit \+ 1\)/g, 'b.hits + 1'],
  'last-admin': [/raise exception 'admin_staff_accounts: cannot demote or disable the last active admin';/g, 'null;'],
  'staff-truncate': [/revoke all on table admin_staff_accounts from service_role;/g, '-- mutated'],
};
const [re, rep] = mutations[kind];
mkdirSync(join(out, 'supabase/migrations'), { recursive: true });
const files = ['schema.sql', ...readdirSync(join(repo, 'supabase/migrations')).map((f) => `migrations/${f}`)];
let hits = 0;
for (const f of files) {
  const src = readFileSync(join(repo, 'supabase', f), 'utf8');
  hits += (src.match(re) || []).length;
  writeFileSync(join(out, 'supabase', f), src.replace(re, rep));
}
console.log(`${kind}: ${hits} replacements`);
