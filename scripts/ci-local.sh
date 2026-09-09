#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

step() {
  printf '\n==> %s\n' "$1"
}

step "Environment"
printf 'Working directory: %s\n' "$ROOT_DIR"
printf 'Go: '
go version
if command -v bun >/dev/null 2>&1; then
  printf 'Bun: '
  bun --version
fi

step "Guard (static)"
./scripts/guard.sh --static-only

step "Go vet"
mkdir -p web/dist
[ -f web/dist/index.html ] || touch web/dist/index.html
GOWORK=off go vet ./...
(cd relaykit && GOWORK=off go vet ./...)

step "Go build"
GOWORK=off go build ./...
(cd relaykit && GOWORK=off go build ./...)

step "Go test"
make test

step "Frontend checks"
if [ -d web ] && command -v bun >/dev/null 2>&1; then
  (cd web && bun install --frozen-lockfile && bun run typecheck && bun run test)
else
  echo "Skipping frontend (bun not found or web/ missing)"
fi

step "Result"
printf 'Local CI passed.\n'
