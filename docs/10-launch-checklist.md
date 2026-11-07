# MVP launch checklist — November 13, 2026 target

This checklist tracks owner decisions and evidence needed before the production site replaces WordPress. A checked box requires the stated evidence; a passing source build alone is insufficient.

| Done | Item and owner | Source | Done when |
|---|---|---|---|
| [ ] | Confirm target Supabase project and apply schema — owner with data lane | Assignment D3; `supabase/README.md` | The correct project is identified, migration is applied in a controlled environment, and RLS is reviewed on every table. |
| [ ] | Review import readiness and seed — owner with data lane | Assignment D4; `migration-files/parsed/import-readiness.md` | Counts and sample rows match the 120 published sermons and 80 events; DST and repeat behavior are reviewed; the guarded seed runs against the intended project only. |
| [ ] | Verify owner-confirmed Express(o) record — owner with data lane | Assignment owner decision 5; D4 | The weekly Sunday 8:30 AM America/Chicago cafe schedule is reflected in the canonical event and reviewed in the public calendar. |
| [ ] | Configure Vercel Preview environment — owner | Assignment owner decision 6; `docs/admin-setup.md` | Preview has the required Supabase and NextAuth variables, and a protected admin sign-in and sample edit are checked. Production variables are already reported as set; verify values before launch. |
| [ ] | Confirm giving destination — owner | `docs/audit/2026-11/pages/give.md` | The live ChurchSuite donation URL and any alternative giving methods are approved and the new CTA reaches the intended destination. |
| [ ] | Replace/approve forms — owner with experience lane | `docs/audit/2026-11/integrations.md`; owner forms decision | ChurchSuite embeds are used where available; other forms use owner-approved Google Forms; every contact, prayer, kids, visitor, group, newsletter, and Youth Alpha form is submitted successfully. |
| [ ] | Create Youth Alpha ministry record — owner | `docs/audit/2026-11/pages/youth-alpha.md`; assignment E6 | Approved current copy and form URL are entered in the canonical record; stale dates are resolved; /youth-alpha/ redirects to the published ministry page. |
| [ ] | Approve visitor copy and service schedule — church content owner | `docs/audit/2026-11/pages/`; `content/pages/plan-a-visit.mdx` | The stale MDX “paused” statement is corrected to reflect the owner-confirmed Sunday 8:30 cafe service; remaining page copy, images, and contacts are approved. |
| [ ] | Review Search Console and active Ads destinations — owner with experience lane | `docs/04-seo-url-migration-map.md`; `docs/audit/2026-11/url-inventory.md` | Every high-value legacy URL is mapped; decided redirects work without loops; temporary taxonomy redirects remain temporary. |
| [ ] | Verify public pages and accessibility — experience lane with owner | Assignment E1–E6; QA report | Required pages are useful on mobile and desktop, keyboard navigation works, and no route depends on invented facts. |
| [ ] | Verify tracking and media — owner | `docs/audit/2026-11/integrations.md` | Approved GTM/GA4/Ads IDs, newsletter, video, podcast, and media destinations work in the intended environment. |
| [ ] | Review production deployment and domain/DNS — owner | Vercel project settings; `docs/workflow/devops-automation.md` | Production variables, deployment checks, primary domain, redirects, and DNS cutover steps are confirmed before switching traffic. |
| [ ] | Agree on rollback — owner with QA | `docs/workflow/git-and-worktrees.md` | Previous WordPress route or prior deployment can be restored, and the decision maker and procedure are recorded. |
| [ ] | Final church approval — owner | This checklist and QA report | Content, forms, data, SEO mapping, and release timing are explicitly approved. |

The audit records public evidence and recommendations. It does not authorize a live database write, domain change, or merge to production.
