# Contributing to new-api (mezon-llm fork)

## Workflow

For non-trivial changes, use the full flow that syncs with GitHub Issues:

```bash
/opsx:flow "add Mistral relay adapter"      # idea → issue → spec → implement → PR
/opsx:flow #12                              # resume from existing issue
/opsx:flow add-mistral-relay                # resume from change name
```

This creates a GitHub issue, runs OpenSpec specification, implements with test-first discipline,
opens a PR linked to the issue, and posts a completion report.

For simpler changes (copy fix, obvious defect, config/docs only):

1. Branch from `main`: `feature/<description>` or `fix/<description>`.
2. Make changes following the conventions in `AGENTS.md`.
3. Validate locally: `./scripts/ci-local.sh`.
4. Open a pull request against `main` with `Closes #<issue>` in the body.
5. Use `.agents/github/PR.md` as the PR body template.

## Commit convention

Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`.

Scope is the area touched: `relay`, `model`, `controller`, `service`, `middleware`, `billing`,
`auth`, `web`, `i18n`, `ci`, `docs`, `relaykit`.

Examples:
- `feat(relay): add Mistral native adapter`
- `fix(billing): prevent overflow in quota conversion`
- `test(model): cover subscription reset edge cases`
- `docs: update configuration table in README`
- `refactor(service): extract task polling into adaptor`

## Validation

Before opening a PR, run the local CI pipeline:

```bash
./scripts/ci-local.sh
```

This runs static guards, Go vet, build (both root and relaykit), Go tests, frontend typecheck
and tests. It uses the installed Go SDK and cached modules. The build/test steps match GitHub
CI, but the host environment is not identical.

For a shorter development loop:

```bash
./scripts/guard.sh --static-only   # credential, encoding/json, billing-cast, OpenSpec checks
go build ./...
make test
```

All checks must be green.

## Code standards

### Backend (Go)

- All JSON marshal/unmarshal through `common/json.go` wrappers — never import `encoding/json` directly.
- Database code must work with SQLite, MySQL, and PostgreSQL simultaneously.
- `lockForUpdate(tx)` for row locks — never the legacy GORM v1 pattern.
- Quota conversions through `common/quota_math.go` — never bare `int()` casts.
- Optional request fields use pointer types with `omitempty`.
- `relaykit/` must build independently: `cd relaykit && GOWORK=off go build ./...`.
- Tests use `stretchr/testify` (require for fatal, assert for non-fatal).

### Frontend (React/TypeScript)

- `bun` as package manager and script runner.
- i18n via `i18next` / `react-i18next` with flat JSON locale files.
- Follow `web/AGENTS.md` for detailed frontend conventions.

## Testing

Backend tests must protect real behavior, API contracts, billing invariants, or regression paths.
See `AGENTS.md` § Backend test quality for the full policy.

```bash
# All Go tests (root + relaykit)
make test

# Frontend tests
cd web && bun run test
```

## Agent development

This repository is configured for AI-assisted development. See `AGENTS.md` for agent instructions,
`CONTEXT.md` for domain glossary, and `.agents/skills/` for task-specific procedures.

Skills live once at `.agents/skills/<name>/SKILL.md`. Claude Code reads them via symlinks in
`.claude/skills/`. Adding another agent tool means adding symlinks, not duplicating prose.
