# docs/agents: multi-agent session records

Each file here has exactly **one writer**, so parallel agents never conflict on documentation.

| Folder | Written by | One file per | Name |
|---|---|---|---|
| `assignments/` | product-manager | session | `<YYYY-MM-DD>-<session-name>.md` |
| `sessions/` | scribe, on behalf of one branch | branch | `<YYYY-MM-DD>-<tool>-<lane>-<slug>.md` |
| `qa/` | senior-qa | session | `<YYYY-MM-DD>-<session-name>.md` |

`sessions/*.pr.md` files are scratch PR bodies and are gitignored.

**Reading another lane's live log** (without switching branches):
`git fetch && git show origin/<tool>/<lane>-<slug>:docs/agents/sessions/<file>.md`

The flow is `assignments` → `sessions` → `qa` → the next session's `assignments`. See `docs/workflow/workflow.md`.
