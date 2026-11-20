# Dependency triage — 2026-11-20

## Audit result

Ran `npm audit --package-lock-only` on Node v22.23.5 / npm 10.9.9 before changes. The lockfile reported **6 moderate, 0 high, 0 critical** findings. Every finding was transitive and development-only; each had a compatible fix available. The audit attributed the findings to the minimatch globparts-amplification advisory [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).

| Package | Severity | Direct/transitive | Runtime/dev-only | Fix available | Decision |
|---|---|---|---|---|---|
| @typescript-eslint/eslint-plugin | Moderate | Transitive | Dev-only | Yes | Fix now; updated compatible @typescript-eslint dependency set |
| @typescript-eslint/parser | Moderate | Transitive | Dev-only | Yes | Fix now; updated compatible @typescript-eslint dependency set |
| @typescript-eslint/type-utils | Moderate | Transitive | Dev-only | Yes | Fix now; updated compatible @typescript-eslint dependency set |
| @typescript-eslint/typescript-estree | Moderate | Transitive | Dev-only | Yes | Fix now; updated compatible @typescript-eslint dependency set |
| @typescript-eslint/utils | Moderate | Transitive | Dev-only | Yes | Fix now; updated compatible @typescript-eslint dependency set |
| minimatch | Moderate | Transitive | Dev-only | Yes | Fix now; removed affected nested versions through compatible dependency updates |

## Remediation and verification

Ran `npm audit fix --package-lock-only` without `--force`. It updated the lockfile's compatible @typescript-eslint packages to 8.73.0 and refreshed the compatible dependency tree. It did not change package.json. No breaking fix was requested or applied.

A fresh `npm audit --package-lock-only` after remediation reported **0 vulnerabilities**.

## Dependabot proposal

**Owner decision for this session:** keep this as a written proposal; do not enable it yet. Revisit after launch, when CI is trusted and the owner is ready to route its pull requests.

Suggested settings if enabled later:

- Schedule weekly updates for npm and GitHub Actions.
- Group minor and patch updates separately by ecosystem; keep major updates as individual pull requests.
- Use a low open pull request limit (suggested: 5).
- Label pull requests `lane:ops`.
- Keep auto-merge disabled; route updates through QA and the normal gate.

No Dependabot configuration file was added in this session.
