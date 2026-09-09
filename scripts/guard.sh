#!/usr/bin/env bash
# Guard checks for new-api (mezon-llm). Run as part of pre-push or manually.
# Each check is a function that returns 0 (pass) or 1 (fail).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FAILURES=0
STATIC_ONLY=false

case "$*" in
  '') ;;
  --static-only) STATIC_ONLY=true ;;
  *) printf 'Usage: %s [--static-only]\n' "$0" >&2; exit 2 ;;
esac

check_no_credentials() {
  echo "Checking for credential patterns in Go source..."
  if grep -rn --include='*.go' \
    -e 'sk-[a-zA-Z0-9]\{20,\}' \
    -e 'ghp_[a-zA-Z0-9]\{36\}' \
    -e 'AKIA[0-9A-Z]\{16\}' \
    -e 'password\s*=\s*"[^"]\+"' \
    controller/ service/ model/ relay/ middleware/ oauth/ main.go 2>/dev/null; then
    echo "FAIL: Possible credential found in source code"
    return 1
  fi
  echo "  PASS"
}

check_no_raw_encoding_json() {
  echo "Checking for NEW direct encoding/json imports..."
  # AGENTS.md rule: all JSON marshal/unmarshal must go through common/json.go
  # Only check files changed since the upstream merge base (forked codebase has legacy violations)
  local changed_files violations
  changed_files=$(git diff --name-only --diff-filter=ACMR origin/main...HEAD -- '*.go' 2>/dev/null \
    || git diff --name-only --diff-filter=ACMR HEAD~1 -- '*.go' 2>/dev/null \
    || true)
  if [ -z "$changed_files" ]; then
    echo "  PASS (no changed Go files)"
    return 0
  fi
  violations=$(echo "$changed_files" \
    | xargs grep -n '"encoding/json"' 2>/dev/null \
    | grep -v '_test\.go:' \
    | grep -v 'common/' \
    | grep -v '// guard:allow-encoding-json' \
    || true)
  if [ -n "$violations" ]; then
    echo "$violations"
    echo "FAIL: New direct encoding/json import found (use common.Marshal/Unmarshal)"
    return 1
  fi
  echo "  PASS"
}

check_no_bare_quota_cast() {
  echo "Checking for NEW bare int() casts on quota values..."
  # AGENTS.md rule: never convert quota with bare int() — use common/quota_math.go
  # Only check changed files (forked codebase has legacy violations)
  local changed_files violations
  changed_files=$(git diff --name-only --diff-filter=ACMR origin/main...HEAD -- '*.go' 2>/dev/null \
    || git diff --name-only --diff-filter=ACMR HEAD~1 -- '*.go' 2>/dev/null \
    || true)
  if [ -z "$changed_files" ]; then
    echo "  PASS (no changed Go files)"
    return 0
  fi
  violations=$(echo "$changed_files" \
    | xargs grep -n -e 'int(.*quota' -e 'int(math\.Round' -e 'int(float64.*ratio' 2>/dev/null \
    | grep -v '_test\.go:' \
    | grep -v '// guard:allow-bare-cast' \
    || true)
  if [ -n "$violations" ]; then
    echo "$violations"
    echo "FAIL: New bare int() cast on quota/billing value (use common.QuotaFromFloat/QuotaRound)"
    return 1
  fi
  echo "  PASS"
}

check_no_legacy_gorm_lock() {
  echo "Checking for NEW legacy GORM v1 locking patterns..."
  # Only check changed files (the codebase documents the legacy pattern in locking.go)
  local changed_files violations
  changed_files=$(git diff --name-only --diff-filter=ACMR origin/main...HEAD -- '*.go' 2>/dev/null \
    || git diff --name-only --diff-filter=ACMR HEAD~1 -- '*.go' 2>/dev/null \
    || true)
  if [ -z "$changed_files" ]; then
    echo "  PASS (no changed Go files)"
    return 0
  fi
  violations=$(echo "$changed_files" \
    | xargs grep -n 'Set("gorm:query_option"' 2>/dev/null \
    | grep -v '_test\.go:' \
    | grep -v '// guard:allow-legacy-lock' \
    || true)
  if [ -n "$violations" ]; then
    echo "$violations"
    echo "FAIL: New legacy GORM v1 locking pattern (use lockForUpdate(tx))"
    return 1
  fi
  echo "  PASS"
}

check_openspec_validate() {
  if [ ! -f openspec/config.yaml ]; then
    echo "Skipping OpenSpec validate (no openspec/config.yaml)"
    return 0
  fi
  if ! command -v npx >/dev/null 2>&1; then
    echo "Skipping OpenSpec validate (npx not found)"
    return 0
  fi
  echo "Running OpenSpec validate..."
  if ! OPENSPEC_TELEMETRY=0 npx openspec validate --all 2>&1; then
    echo "FAIL: OpenSpec validation failed"
    return 1
  fi
  echo "  PASS"
}

check_go_vet() {
  echo "Running go vet (root module)..."
  # Need web/dist placeholder for embed
  mkdir -p web/dist
  [ -f web/dist/index.html ] || touch web/dist/index.html
  if ! GOWORK=off go vet ./... 2>&1; then
    echo "FAIL: go vet failed"
    return 1
  fi
  echo "  PASS"
}

check_go_vet_relaykit() {
  echo "Running go vet (relaykit)..."
  if ! (cd relaykit && GOWORK=off go vet ./...) 2>&1; then
    echo "FAIL: go vet relaykit failed"
    return 1
  fi
  echo "  PASS"
}

check_go_build() {
  echo "Running go build..."
  mkdir -p web/dist
  [ -f web/dist/index.html ] || touch web/dist/index.html
  if ! GOWORK=off go build ./... 2>&1; then
    echo "FAIL: Build failed"
    return 1
  fi
  echo "  PASS"
}

check_go_build_relaykit() {
  echo "Running go build (relaykit)..."
  if ! (cd relaykit && GOWORK=off go build ./...) 2>&1; then
    echo "FAIL: relaykit build failed"
    return 1
  fi
  echo "  PASS"
}

check_go_test() {
  echo "Running Go tests..."
  if ! make test 2>&1; then
    echo "FAIL: Tests failed"
    return 1
  fi
  echo "  PASS"
}

echo "=== new-api Guard ==="
echo ""

# Static checks (always run)
check_no_credentials || FAILURES=$((FAILURES + 1))
check_no_raw_encoding_json || FAILURES=$((FAILURES + 1))
check_no_bare_quota_cast || FAILURES=$((FAILURES + 1))
check_no_legacy_gorm_lock || FAILURES=$((FAILURES + 1))
check_openspec_validate || FAILURES=$((FAILURES + 1))

if [ "$STATIC_ONLY" = false ]; then
  check_go_vet || FAILURES=$((FAILURES + 1))
  check_go_vet_relaykit || FAILURES=$((FAILURES + 1))
  check_go_build || FAILURES=$((FAILURES + 1))
  check_go_build_relaykit || FAILURES=$((FAILURES + 1))
  check_go_test || FAILURES=$((FAILURES + 1))
fi

echo ""
if [ "$FAILURES" -gt 0 ]; then
  echo "FAILED: $FAILURES check(s) failed"
  exit 1
else
  echo "All checks passed."
fi
