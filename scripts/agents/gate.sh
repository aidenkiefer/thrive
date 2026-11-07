#!/usr/bin/env bash
# Quality gate. REQUIRED before every push (builders) and before every merge (QA). CI runs it too.
#   scripts/agents/gate.sh          full gate: typecheck + lint (if configured) + production build
#   scripts/agents/gate.sh --quick  typecheck + lint only (cheap mid-work spot check)
#   scripts/agents/gate.sh --ci     full gate, no scope report (used by GitHub Actions)
# Docs: docs/workflow/devops-automation.md
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
mode="${1:-full}"; fail=0

step() {
  local name="$1"; shift
  echo "▶ $name: $*"
  if "$@"; then echo "✔ $name"; else echo "✖ $name FAILED"; fail=1; fi
}

[[ -d node_modules ]] || step install npm ci --no-audit --no-fund
step typecheck npx tsc --noEmit
if compgen -G "eslint.config.*" >/dev/null || compgen -G ".eslintrc*" >/dev/null; then
  step lint npm run lint
else
  echo "• lint skipped (no ESLint config yet; ops-lane ticket to add one)"
fi
[[ "$mode" == "--quick" ]] || step build npm run build

if [[ "$mode" != "--ci" ]]; then
  git fetch origin main --quiet 2>/dev/null || true
  echo; echo "Files changed vs origin/main (QA checks these against your lane):"
  git diff --name-only origin/main...HEAD | sed 's/^/  /'
  [[ -n "$(git status --porcelain)" ]] && echo "⚠ uncommitted changes present"
fi

echo
if (( fail )); then echo "GATE: FAIL. Do not push or merge."; else echo "GATE: PASS"; fi
exit $fail
