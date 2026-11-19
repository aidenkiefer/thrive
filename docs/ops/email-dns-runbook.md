# Email DNS and sender setup

**Owner decision, 2026-11-19.** Use the owner-selected root info mailbox as the From address for staff sign-in codes and website forms. The same mailbox is the default production form recipient. Verify `thrivevineyard.com` in Resend to authorize this sender. An alternative is to use the info mailbox on the updates subdomain as From and the root info inbox as Reply-To. This uses existing subdomain records, avoids root DNS changes and helps isolate sending reputation. The owner selected the root sender because three new DNS labels preserve Google Workspace MX and require no apex SPF merge.

**Status, 2026-11-19 at approximately 14:12 CST.** The owner-authorized Resend page showed the root domain on Forge in `us-east-1` as **Verified**, including DKIM and both sending CNAMEs. Queries against authoritative DNS (`ns09.domaincontrol.com`) and recursive DNS (`1.1.1.1`) matched all three required rows. The complete DKIM TXT matched the displayed public key. The five Google Workspace apex MX hosts and priorities also matched the baseline.

The owner reported successfully saving the three records using Resend's automatic GoDaddy setup. GoDaddy displayed a TTL of **1 Hour** for all three. The table below retains the TTL requested by Resend.

The owner authorized Browser Control in chat: "you can use Browser Control to check on the configuration and see what we have to do next". The earlier DNS check used already-open Chrome pages for public Resend DNS/domain settings and GoDaddy DNS. During that DNS check the agent made no login or configuration changes, requested no keys or passwords, and opened no API-key or SMTP-credential pages. An attempted navigation to Configuration failed because the browser control could not locate its clickable area.

At 14:11 CST the optional root DMARC name still returned NXDOMAIN. The owner was offered the monitoring-policy row below. Manual publication remains unconfirmed. Before advancing to quarantine or reject, verify Google Workspace outbound authentication and DMARC alignment using authorized message headers. Other DKIM selectors may exist beyond those queried. The owner reported tracking off and Supabase custom SMTP saved successfully. At the owner's explicit request, Browser Control filled the public sender, host and username fields. The UI showed custom SMTP enabled and displayed its host and port. The owner privately created and entered the dedicated SMTP key and clicked Save. No key was observed. The Auth template, separate forms key and website forms setup remain unconfirmed. Sandbox delivery tests have not run.

## Pre-change public DNS baseline

Read-only `nslookup` observations on 2026-11-19 at 13:57 CST (`dig` unavailable). Names in the table are relative to `thrivevineyard.com`.

| Name | Type | Observation |
| --- | --- | --- |
| @ | NS | ns09.domaincontrol.com and ns10.domaincontrol.com |
| @ | MX | Google Workspace: aspmx.l.google.com (1), alt1 and alt2.aspmx.l.google.com (5 each), alt3 and alt4.aspmx.l.google.com (10 each). Each alt host has the suffix aspmx.l.google.com. |
| @ and updates | TXT | NOERROR with no TXT answers at either exact name. No SPF seen at either name. |
| _dmarc and _dmarc.updates | TXT | NXDOMAIN at both names. |
| resend._domainkey.updates | TXT | Public DKIM key present. Key material omitted. |
| send.updates | CNAME | send.forge.rmta.net |
| send.updates | TXT and MX via alias | Target SPF: `v=spf1 ip4:52.3.252.119 ip4:44.222.39.36 ip4:199.249.231.0/24 ~all`. Target MX: feedback.forge.rmta.net (10). |
| send | DNS | NXDOMAIN. |

TXT and CNAME checks covered the selectors google, resend, selector1, selector2 and default under both domains. Only the Resend TXT selector under updates returned a key. DKIM selectors cannot be enumerated through ordinary queries, so other selectors may exist.

## Owner enters the public records

1. In Resend, open **Domains**, add or select the exact root domain, and open its sending records. Keep receiving disabled. Copy only the public record type, name, value, priority (MX) and TTL from that screen. Keep credentials in the owner-managed dashboards. [Domain verification](https://resend.com/docs/dashboard/domains/introduction)
2. Enter the three required rows below. The owner may also publish the recommended DMARC row. Names are ready for GoDaddy. For DKIM, copy the entire public value from the root-domain dashboard.

| Type | GoDaddy Name | Value | TTL | Status at 14:12 CST |
| --- | --- | --- | --- | --- |
| TXT | `resend._domainkey` | Copy the complete DKIM value beginning with `p=` directly from Resend | Auto | Verified |
| CNAME | `rsend` | `rsend.forge.rmta.net` | Auto | Verified |
| CNAME | `send` | `send.forge.rmta.net` | Auto | Verified |
| TXT (optional) | `_dmarc` | `v=DMARC1; p=none;` | Auto | Recommended |

3. In GoDaddy, open the domain's DNS records. For each dashboard row, use its exact type. Convert a fully qualified name to a GoDaddy **Name** by removing the trailing dot if present and stripping the final `.thrivevineyard.com` once. Use `@` for the apex. Keep an already-relative label as supplied. Preserve the dashboard **Value**, TTL and MX priority. Compare existing rows at that exact name before saving. [GoDaddy DNS entry](https://www.godaddy.com/help/add-a-txt-record-19232)
4. Both CNAME names must be free of conflicting data, including TXT or MX records. The Forge dashboard requests no MX or SPF TXT rows. Preserve the Google Workspace apex MX set, apex SPF state and existing updates records. The default return-path name is `send`. Resend documents the r-prefixed sibling as a required member of the sending CNAME pair. Retain `rsend` even if an A lookup of its target returns no address. [Custom return path](https://resend.com/docs/dashboard/domains/custom-return-path)
5. SPF permits one policy per exact DNS name. The baseline found no apex SPF. The return-path CNAME requires no apex SPF merge. [SPF specification](https://www.rfc-editor.org/info/rfc7208/)

## Verify before enabling either sender

Query the authoritative server first. Repeat the four new-record checks with `1.1.1.1` in place of `ns09.domaincontrol.com` to check recursive visibility. Compare each answer with the Value column above. Join quoted TXT chunks before comparing DKIM. Check DMARC if the owner publishes the optional row. The nslookup commands work independently. The optional dig examples require dig to be installed.

```text
nslookup -type=TXT resend._domainkey.thrivevineyard.com ns09.domaincontrol.com
nslookup -type=CNAME rsend.thrivevineyard.com ns09.domaincontrol.com
nslookup -type=CNAME send.thrivevineyard.com ns09.domaincontrol.com
nslookup -type=TXT _dmarc.thrivevineyard.com ns09.domaincontrol.com
nslookup -type=MX thrivevineyard.com
nslookup -type=CNAME send.updates.thrivevineyard.com
dig @ns09.domaincontrol.com send.thrivevineyard.com CNAME +noall +answer
dig @1.1.1.1 send.thrivevineyard.com CNAME +noall +answer
```

Expect each public record to match Resend and the apex MX and updates alias to match the baseline. If only the authoritative answer matches, allow the previous TTL or negative cache to expire and repeat. If the authoritative answer differs, check the GoDaddy Name, type, value and priority. In Resend request verification and wait for **Verified** on the root domain.

## Owner configures delivery

- Create two separate Resend keys with **Sending access**, each restricted to the verified root domain. Use one for Supabase Auth SMTP and one for website forms. Enter credentials directly into their respective owner-managed secret settings. Disable open and click tracking for transactional mail. [Resend API key permissions](https://resend.com/docs/dashboard/api-keys/introduction)
- In Supabase Auth enable custom SMTP. Set host `smtp.resend.com`, port `465`, username `resend`, and use the dedicated SMTP key as the password. Set the From address to the owner-selected root info mailbox. Keep new-user signups disabled. [Resend SMTP with Supabase](https://resend.com/docs/send-with-supabase-smtp)
- For staff code sign-in, edit the **Magic Link** template. Use subject **Your Thrive staff sign-in code**. In the body say “Enter this code on the staff sign-in screen.” Display the Supabase Token template variable on its own line. Use code-only delivery with no link or marketing content. If stating a lifetime, match the configured Auth OTP expiry. [Auth email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- Configure the website's separate server-side sending key in the owner-managed environment. Set `FORMS_MAIL_FROM` to the owner-selected root info mailbox and `FORMS_DEFAULT_RECIPIENT` to that mailbox for production.
- Before testing, the owner must name a sandbox mailbox privately. In the test environment override the forms recipient to that mailbox and confirm the selected form has no additional or overriding recipients. For Auth, use an existing authorized sandbox staff identity that delivers there. Keep the mailbox address outside the repository.
- After root verification and configuration, the owner requests one sign-in code and submits one synthetic form. In the sandbox inbox confirm delivery, the selected From address, code-only Auth content, and the form notification. Check message headers for DKIM/SPF results and alignment with the From domain. Record only pass/fail and time. Keep codes, mailbox addresses and message headers out of logs.

## Completion record

- [x] Owner selected the root sender on 2026-11-19.
- [x] Public Resend DNS table observed in the owner-authorized Chrome page.
- [x] All three required records are published in the GoDaddy-hosted zone.
- [x] Authoritative and recursive DNS answers verified against Resend.
- [x] Resend shows Verified for the root domain, DKIM and both sending CNAMEs.
- [x] Owner reported tracking off and Supabase custom SMTP saved.
- [ ] Owner confirmed the code-only Auth template.
- [ ] Owner configured website forms.
- [ ] Owner confirmed sandbox delivery for staff Auth and forms.

