# Code Conventions

Extracted from [AGENTS.md](../../AGENTS.md) for reference. The source of truth is AGENTS.md.

## Go

- Go 1.25+ (go.mod specifies 1.25.1).
- All JSON through `common/json.go` — never import `encoding/json` directly.
- Database code works on SQLite, MySQL, and PostgreSQL.
- GORM methods preferred over raw SQL.
- `lockForUpdate(tx)` for row locks.
- Quota conversions through `common/quota_math.go`.
- Optional request fields: pointer types with `omitempty`.
- `relaykit/` builds independently (`cd relaykit && GOWORK=off go build ./...`).
- Tests use `stretchr/testify`.
- Direct, readable code: early returns, clear branches, named locals.
- Minimal nested function definitions.

## Frontend

- Bun as package manager.
- React 19, TypeScript, Rsbuild.
- i18n via `i18next` / `react-i18next`.
- Flat JSON locale files in `web/src/i18n/locales/`.
- Base UI components, Tailwind CSS.
- See `web/AGENTS.md` for detailed frontend conventions.

## Commits

Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`.

Scope: `relay`, `model`, `controller`, `service`, `middleware`, `billing`, `auth`, `web`,
`i18n`, `ci`, `docs`, `relaykit`, `oauth`, `setting`.

## PRs

- Agent PRs use `.agents/github/PR.md` template.
- Human PRs use `.github/PULL_REQUEST_TEMPLATE.md`.
- AI disclosure required if git user is not a historical core developer.
- Protected content: new-api and QuantumNous references.
