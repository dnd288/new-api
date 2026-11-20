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
  2. merge upstream/main (fails and leaves the merge open if conflicts need manual resolution)
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
    -h|--help) usage; exit 0 ;;
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

step "Dry-run merge to detect conflicts"
CONFLICTS="$(git merge-tree --write-tree --name-only main "$UPSTREAM_HEAD" 2>&1 | tail -n +2 || true)"
if [ -n "$CONFLICTS" ]; then
  printf 'Merge conflicts detected:\n%s\n' "$CONFLICTS"
  printf 'Resolve them manually, then rerun this script.\n' >&2
  exit 3
fi

step "Merge upstream/main"
git merge --no-ff "$UPSTREAM_HEAD" -m "Merge upstream/main into main (sync $(date '+%b %Y'))"

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
