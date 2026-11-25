# Google Forms launch tooling (#151)

An operator CLI that creates, configures, publishes and reads back Thrive's event and group signup forms using the documented [Google Forms REST API](https://developers.google.com/workspace/forms/api/reference/rest). Google hosts the respondent form and stores the responses. The Thrive site only links to the published responder URL ([#149](https://github.com/aidenkiefer/thrive/issues/149)).

The CLI has no response-submit, response-sync or response-download step. The Forms REST API has no submit method. Custom Thrive fields and an Apps Script bridge are post-MVP ([#148](https://github.com/aidenkiefer/thrive/issues/148)).

```
npx tsx scripts/google-forms/forms.ts validate          # offline
npx tsx scripts/google-forms/forms.ts plan              # offline dry run, prints a plan ID
npx tsx scripts/google-forms/forms.ts apply --confirm <planId>   # live
npx tsx scripts/google-forms/forms.ts inspect <entityKey>        # live, read-only
```

Options: `--templates <dir>`, `--launch <file>` and `--manifest <file>`. The defaults are the paths below.

## Files

| Path | What | Who edits |
|---|---|---|
| `templates/<key>.v<n>.json` | Reusable, versioned question set (`kind`: `event` or `group`) | Data lane. The owner approves the wording |
| `launch.json` (copy from `launch.example.json`) | Which entity gets which template, plus the owner-supplied title and description and the `publish` flag | Operator, from owner-approved content |
| `manifest.json` | What the CLI created in Google (contract C1) | **CLI only** |
| `manifest.example.json` | C1 fixture showing each state. The IDs are fake | Data lane |

### Templates

- A version bump is a new file (`group-signup.v2.json`). Old versions stay in the repo so recorded forms remain reproducible.
- Question types are `shortText`, `paragraph`, `radio`, `checkbox` and `dropdown`. Choice types need `options`.
- `settings.emailCollectionType` maps to the Forms setting: `DO_NOT_COLLECT`, `VERIFIED` or `RESPONDER_INPUT`.
- `approval.status` is `draft` until the owner approves the questions. Then set it to `approved` with `approvedBy` (a role, e.g. `owner`) and `approvedOn` (`YYYY-MM-DD`). **The shipped templates are drafts.** Their questions are starter wording, not approved content.
- A draft template can reach Google only for a `sandbox:` entity. The plan blocks every other entity.
- Placeholder text (`TODO`, `TBD`, `{{ }}` and similar) fails validation.

### Launch entries

`entityKey` is `event:<slug>`, `group:<slug>` or `sandbox:<slug>`, and matches the canonical entity's slug. There is one form per entity. Titles and descriptions come from the owner. Never invent them.

## Contract C1: manifest → public signup link

Each manifest entry has `entityKey`, `templateKey`, `templateVersion`, `formId`, `responderUrl` and `publicationState`. It also has management fields (`contentHash`, `revisionId` and `updatedAt`). The key set is strict, so a token, editor URL or response field fails validation.

| `publicationState` | Meaning | `formId` | `responderUrl` |
|---|---|---|---|
| `planned` | Listed, not created | null | null |
| `creating` | A create was sent but its result was not recorded (see Recovery) | null | null |
| `created` | Exists in Google, unpublished, template content not applied | set | null |
| `configured` | Template applied, not published | set | null |
| `published` | Published and accepting responses | set | `https://docs.google.com/forms/d/e/<id>/viewform` |

Rules for public surfaces (Experience lane):

- **Public pages read the link from the entity's existing admin signup-URL field**, gated as today by `isApprovedFormUrl` (`src/lib/form-urls.ts`). The owner pastes an approved, published `responderUrl` from the manifest into that field in the setup window. Pages never read the manifest. Nothing writes the manifest into Supabase, and page views never call the Google API.
- `publicResponderUrl(entry)` (`src/lib/google-forms/validate.ts`) answers which manifest URL may be copied into admin. It returns the URL only for a `published` non-sandbox entry whose URL is a responder link that also passes `isApprovedFormUrl`. Otherwise it returns `null`. Experience can use it with the fixture manifest to build the linked versus pending or unavailable development states.
- Editor URLs (`/forms/d/<id>/edit`) and prefill links are never public and never recorded.
- `manifest.example.json` is a fixture (`"fixture": true`). Its URLs are fake. Use it for development states only. `apply` refuses to run against it.

## How `plan` and `apply` work

1. `plan` validates everything, compares the launch file with the manifest and prints ordered operations per entity with a 12-character plan ID. It needs no credentials and makes no network calls.
2. A new entity gets `forms.create` (with `unpublished=true`) → `forms.batchUpdate` (info, settings, questions) → `forms.setPublishSettings` → `forms.get`, the last two only when `publish` is `true`. `forms.create` accepts only the title, so everything else goes through `batchUpdate`.
3. Reconciliation: an entity with a recorded `formId` is **never created again**. `created` entries resume at `batchUpdate`. Unchanged `configured` entries only publish. `published` entries are read back (`forms.get`) and left alone.
4. **Blocked** entries stop the plan, and `apply` refuses any plan that has one:
   - a `creating` entry (a lost create result)
   - a `published` form whose content differs from the launch file. The CLI does not rewrite live forms, because existing responses would detach from changed questions
   - a draft template for a non-sandbox entity
   - a changed `templateKey`
5. `apply --confirm <planId>` recomputes the plan and runs only if the ID matches what you reviewed. Content writes carry `writeControl.requiredRevisionId`, so an edit made in Google since the read fails the batch instead of being overwritten. If the live revision differs from the one recorded after the CLI's last write, `apply` stops and does not replace the manual edit. `apply` also stops before any content write when `forms.get` returns no revision ID, or when it shows the form is already published (for example, published directly in Google). Publishing does not change the content revision, so a matching revision ID does not prove the form is still a draft.
6. The manifest is saved atomically after **every** successful step. A failure mid-run leaves an accurate record, and the next `plan` resumes from it.

### Failures, 429 and quota

- `429` and `5xx` responses are retried with truncated exponential backoff and jitter. Retries respect `Retry-After` up to 32 seconds, with at most 4 retries per call. The run then stops with a redacted error.
- `forms.create` is retried **only** on `429`, which Google rejects before doing anything. After a 5xx, a network error, or an accepted create whose response body could not be read, the entry stays `creating`, and the next plan blocks it until a person checks Drive.
- Current [published limits](https://developers.google.com/workspace/forms/api/limits) (checked 2026-11-22): 375 writes/min per project and 150 per user, and 975 reads/min per project. Standard use is at no additional cost. Google says exceeding quota is "planned to incur charges" later in 2026. A launch of a few dozen forms is far below these limits. **Check the project's actual quotas and billing state in the Cloud console before the first live run, and do not enable billing or request a quota increase.**

### Recovery from `creating`

Find the form in Drive by its document name, `Thrive signup · <entityKey> · <templateKey> v<n>`. If it exists, set its entry to `"publicationState": "created"` with that `formId`. If it does not exist, delete the entry. Then run `plan` again.

### Output redaction

The CLI never prints access tokens, and all output also passes through a redaction filter. The filter removes bearer and refresh tokens, key material, email addresses and editor URLs. Form IDs are shortened in console output. The full ID exists only in `manifest.json`, which holds no secrets and is meant to be committed after review.

## Owner setup (later, owner-assisted window)

None of this is done yet. Fixture tests passing is **not** live validation.

**Auth design.** The CLI uses Google's supported [Application Default Credentials](https://cloud.google.com/docs/authentication/provide-credentials-adc) user login through the `gcloud` CLI. There is no hand-rolled OAuth and no new npm dependency. The credential lives in gcloud's private per-user store, never in the repo, `.env` or output. The CLI asks gcloud for a short-lived access token per run (`gcloud auth application-default print-access-token`) and keeps it in memory only.

**Scope:** `https://www.googleapis.com/auth/drive.file`. It covers `create`, `get`, `batchUpdate` and `setPublishSettings`, and limits access to files this OAuth client created. It cannot read other Drive files or other forms. gcloud also requires `cloud-platform` for ADC login.

1. In the church's Google account, create or choose a Cloud project, enable the **Google Forms API** and configure the OAuth consent screen with the `drive.file` scope. Use the internal type if the account is Workspace. No billing account is needed.
2. Create an OAuth client of type **Desktop app**. Download its JSON to a private location outside the repo, e.g. `~/.config/thrive-google-forms/client.json` with `chmod 600`.
3. Install the gcloud CLI, then run:
   `gcloud auth application-default login --client-id-file=$HOME/.config/thrive-google-forms/client.json --scopes=https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/cloud-platform`
4. Set the following in your shell, not in the repo's `.env`:
   - `GOOGLE_FORMS_AUTH=gcloud-adc`
   - optionally `GOOGLE_FORMS_QUOTA_PROJECT=<project-id>`, if Google reports a missing quota project
5. Copy `launch.example.json` to `launch.json`, run `plan`, review it, then run `apply --confirm <id>` for the **sandbox entry only**.
6. Run `inspect sandbox:forms-cli-check` to read back the fields and publish state. Submit one response in a browser through the responder URL. Confirm private review and the standard notification in Google Forms.
7. Only after the owner approves the template wording and the per-entity titles and descriptions: mark the templates `approved`, add the real entries, plan and apply. Paste each approved `responderUrl` into the entity's admin signup field.

If `GOOGLE_FORMS_AUTH` is unset, or gcloud is missing or not logged in, `apply` and `inspect` fail with a clear "not configured" message before making any network call.
