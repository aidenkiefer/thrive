#!/usr/bin/env bash
# Agent worktree manager. One agent = one worktree = one branch named <tool>/<slug>.
# Usage:
#   scripts/agents/worktree.sh new <claude|cursor|codex> <lane-slug> [--no-install]
#   scripts/agents/worktree.sh list | status
#   scripts/agents/worktree.sh remove <tool> <lane-slug>
#   scripts/agents/worktree.sh prune        # remove worktrees whose PR is merged
# Docs: docs/workflow/git-and-worktrees.md
set -euo pipefail

TOOLS="claude cursor codex"
MAIN="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
REPO="$(basename "$MAIN")"
WT_BASE="$(dirname "$MAIN")/${REPO}-worktrees"

die() { echo "error: $*" >&2; exit 1; }
check_tool() { [[ " $TOOLS " == *" $1 "* ]] || die "tool must be one of: $TOOLS"; }
check_slug() { [[ "$1" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || die "slug must be kebab-case (e.g. data-mec-importer)"; }

cmd_new() {
  local tool="${1:-}" slug="${2:-}" install=1
  [[ "${3:-}" == "--no-install" ]] && install=0
  check_tool "$tool"; check_slug "$slug"
  local branch="$tool/$slug" dir="$WT_BASE/$tool-$slug"
  [[ -e "$dir" ]] && die "$dir already exists (resume there, or remove it first)"
  mkdir -p "$WT_BASE"
  git -C "$MAIN" fetch origin main --quiet || echo "warn: fetch failed; using cached origin/main" >&2
  if git -C "$MAIN" show-ref --verify --quiet "refs/heads/$branch"; then
    git -C "$MAIN" worktree add "$dir" "$branch"
  else
    git -C "$MAIN" worktree add -b "$branch" "$dir" origin/main
  fi
  for f in .env.local .env; do
    [[ -f "$MAIN/$f" ]] && cp "$MAIN/$f" "$dir/$f" && echo "copied $f"
  done
  if (( install )); then (cd "$dir" && npm ci --no-audit --no-fund --loglevel=error); fi
  echo
  echo "ready: $dir  (branch $branch)"
  echo "next:  cd \"$dir\"  then start $tool there"
}

cmd_status() {
  git -C "$MAIN" fetch origin --prune --quiet || true
  printf "%-45s %-6s %-6s %-6s %s\n" BRANCH AHEAD BEHIND DIRTY PR
  git -C "$MAIN" worktree list --porcelain | awk '/^worktree /{d=$2} /^branch /{sub("refs/heads/","",$2); print d" "$2}' |
  while read -r dir branch; do
    [[ "$dir" == "$MAIN" ]] && continue
    local ahead behind dirty pr
    ahead=$(git -C "$dir" rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
    behind=$(git -C "$dir" rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
    dirty=$(git -C "$dir" status --porcelain | wc -l | tr -d ' ')
    pr=$(command -v gh >/dev/null && gh pr view "$branch" --json number,state -q '"#\(.number) \(.state)"' 2>/dev/null || echo "-")
    printf "%-45s %-6s %-6s %-6s %s\n" "$branch" "$ahead" "$behind" "$dirty" "$pr"
  done
}

cmd_remove() {
  local tool="${1:-}" slug="${2:-}"; check_tool "$tool"; check_slug "$slug"
  git -C "$MAIN" worktree remove "$WT_BASE/$tool-$slug" \
    || die "git refused (uncommitted work?). Commit/push or inspect it first; never --force blindly."
  echo "removed worktree; branch $tool/$slug kept"
}

cmd_prune() {
  command -v gh >/dev/null || die "gh CLI required to detect squash-merged PRs"
  git -C "$MAIN" worktree list --porcelain | awk '/^worktree /{d=$2} /^branch /{sub("refs/heads/","",$2); print d" "$2}' |
  while read -r dir branch; do
    [[ "$dir" == "$MAIN" ]] && continue
    [[ "$(gh pr view "$branch" --json state -q .state 2>/dev/null || true)" == "MERGED" ]] || continue
    if [[ -n "$(git -C "$dir" status --porcelain)" ]]; then echo "skip $branch: merged but worktree is dirty"; continue; fi
    git -C "$MAIN" worktree remove "$dir" && git -C "$MAIN" branch -D "$branch" >/dev/null && echo "pruned $branch"
  done
  git -C "$MAIN" worktree prune
}

case "${1:-}" in
  new) shift; cmd_new "$@" ;;
  list) git -C "$MAIN" worktree list ;;
  status) cmd_status ;;
  remove) shift; cmd_remove "$@" ;;
  prune) cmd_prune ;;
  *) sed -n '2,9p' "$0"; exit 1 ;;
esac
