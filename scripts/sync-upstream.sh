#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

step() {
  printf '\n==> %s\n' "$1"
}

usage() {
  cat <<USAGE
Usage: $0 [--no-push] [--no-docker]

Syncs upstream QuantumNous/new-api main into this fork's main:
  1. git fetch upstream main
  2. merge upstream/main; on conflict you pick the resolving agent (omp/claude/opencode)
     or preset it with SYNC_AGENT_CMD; unresolved leftovers abort with exit 3
  3. verify: web build, go build, go test, relaykit/tokenkit builds
  4. commit the merge and push origin main
  5. build and push docker image (skipped with --no-docker)

Options:
  --no-push    skip step 4 (local merge only)
  --no-docker  skip step 5
USAGE
}

PUSH=true
DOCKER=true
while [ "$#" -gt 0 ]; do
  case "$1" in
    --no-push) PUSH=false; shift ;;
    --no-docker) DOCKER=false; shift ;;
    -h|--help|-help) usage; exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
done

for bin in git go bun docker gh; do
  command -v "$bin" >/dev/null 2>&1 || { printf 'Missing required command: %s\n' "$bin" >&2; exit 1; }
done

step "Fetch upstream"
git fetch upstream main
UPSTREAM_HEAD="$(git rev-parse upstream/main)"
LOCAL_HEAD="$(git rev-parse main)"
printf 'upstream/main: %s\nlocal main:    %s\n' "$UPSTREAM_HEAD" "$LOCAL_HEAD"

if [ "$UPSTREAM_HEAD" = "$LOCAL_HEAD" ]; then
  printf 'Already up to date with upstream/main.\n'
  if [ "$DOCKER" = true ]; then
    step "Docker build and push"
    ./scripts/docker-build-push.sh
  fi
  exit 0
fi

step "Detect conflicts"
CONFLICTS="$(git merge-tree --write-tree --name-only main "$UPSTREAM_HEAD" 2>&1 | tail -n +2 || true)"

step "Merge upstream/main"
# Use the repo owner identity when no git identity is configured
export GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-$(git config user.name || true)}"
export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-$(git config user.email || true)}"
export GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-$GIT_AUTHOR_NAME}"
export GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-$GIT_AUTHOR_EMAIL}"
if [ -z "${GIT_AUTHOR_NAME:-}" ] || [ -z "${GIT_AUTHOR_EMAIL:-}" ]; then
  export GIT_AUTHOR_NAME="Duong Nguyen Dai"
  export GIT_AUTHOR_EMAIL="hello@mrdnd.dev"
  export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
  export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"
fi

MERGE_MSG="Merge upstream/main into main (sync $(date '+%b %Y'))"
if [ -n "$CONFLICTS" ]; then
  step "Conflicts detected — delegating to coding agent"
  printf '%s\n' "$CONFLICTS"

  AGENT="${SYNC_AGENT_CMD:-}"
  if [ -z "$AGENT" ]; then
    if [ -t 0 ]; then
      printf 'Select coding agent to resolve conflicts:\n'
      printf '  1) omp\n'
      printf '  2) claude\n'
      printf '  3) opencode\n'
      read -r -p "Choice [1-3, default 1]: " AGENT_CHOICE
      case "${AGENT_CHOICE:-1}" in
        1) AGENT="omp -p" ;;
        2) AGENT="claude -p" ;;
        3) AGENT="opencode run" ;;
        *) printf 'Invalid choice: %s\n' "$AGENT_CHOICE" >&2; exit 3 ;;
      esac
    else
      printf 'Conflicts need a coding agent but no terminal to choose from.\n' >&2
      printf 'Set SYNC_AGENT_CMD="omp -p" (or claude/opencode) and rerun.\n' >&2
      exit 3
    fi
  fi
  AGENT_BIN="${AGENT%% *}"
  command -v "$AGENT_BIN" >/dev/null 2>&1 || { printf 'Selected agent not found: %s\n' "$AGENT_BIN" >&2; exit 3; }
  printf 'Using agent: %s\n' "$AGENT"

  git merge --no-ff --no-commit "$UPSTREAM_HEAD" || true
  if ! git rev-parse -q --verify MERGE_HEAD >/dev/null; then
    printf 'Merge did not start; aborting.\n' >&2
    exit 3
  fi

  UNMERGED="$(git diff --name-only --diff-filter=U)"
  PROMPT="You are resolving a git merge in progress in $(pwd).
Context: merging upstream QuantumNous/new-api main into the dnd288/new-api fork.
Conflicted files:
$UNMERGED

Rules:
- Overlapping code/config lines: prefer the UPSTREAM side unless the block is fork-specific content that exists only in this fork (fork-added sections, custom settings, custom registry URLs, fork identity).
- NEVER remove fork-only sections, files, identifiers, or branding; never edit files beyond the conflict resolution.
- No credentials in code. Keep .go files gofmt-clean. Keep i18n keys consistent in all locale files.
- Resolve the conflict markers in every listed file, then run: git add <each resolved file>.
- Do NOT run git commit, git rebase, git reset, or git push.

When done, print a short resolution summary per file."

  if ! $AGENT "$PROMPT"; then
    printf 'Agent failed to resolve conflicts. Merge is still in progress; resolve manually then: git commit --no-edit\n' >&2
    exit 3
  fi

  REMAINING="$(git diff --name-only --diff-filter=U)"
  if [ -n "$REMAINING" ]; then
    printf 'Agent left unresolved files:\n%s\nResolve manually then: git commit --no-edit\n' "$REMAINING" >&2
    exit 3
  fi

  if ! git diff --cached --check >/dev/null 2>&1; then
    printf 'Agent staged content still containing conflict markers:\n' >&2
    git diff --cached --check >&2 || true
    printf 'Resolve manually then: git commit --no-edit\n' >&2
    exit 3
  fi

  git commit --no-edit -m "$MERGE_MSG"
else
  git merge --no-ff "$UPSTREAM_HEAD" -m "$MERGE_MSG"
fi

step "Verify: frontend build"
(cd web && bun install --frozen-lockfile && bun run build)

step "Verify: go build and test"
go build ./...
go test ./...

step "Verify: submodules"
(cd relaykit && GOWORK=off go build ./...)
(cd tokenkit && GOWORK=off go build ./...)

if [ "$PUSH" = true ]; then
  step "Push origin main"
  git push origin main
fi

if [ "$DOCKER" = true ]; then
  step "Docker build and push"
  ./scripts/docker-build-push.sh
fi

printf '\nDone. Synced to %s\n' "$UPSTREAM_HEAD"
