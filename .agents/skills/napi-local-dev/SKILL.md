---
name: napi-local-dev
description: >-
  Environment setup, first-time bootstrap, Docker, troubleshooting for new-api
---

# napi-local-dev

## Ownership

| What | Where |
|------|-------|
| Backend entry | `main.go` |
| Frontend | `web/` (Bun + Rsbuild) |
| Docker compose (dev) | `docker-compose.dev.yml` |
| Docker compose (prod) | `docker-compose.yml` |
| Makefile | `makefile` |
| Environment | `.env` (gitignored) |
| relaykit submodule | `relaykit/` (independent Go module) |

## Prerequisites

- Go 1.25+ (`go version`)
- Bun (`bun --version`) — for frontend
- Docker + Docker Compose — for dev database (PostgreSQL)
- Node.js + npm/npx — for OpenSpec (`npx openspec`)

## First-time Bootstrap

```bash
# 1. Clone and enter
git clone git@github.com:dnd288/new-api.git ~/src/mezon-llm
cd ~/src/mezon-llm

# 2. Environment
cp .env.example .env   # if exists, otherwise create .env manually
# Required: SQL_DSN, SESSION_SECRET, INITIAL_ROOT_TOKEN

# 3. Frontend build (embedded in Go binary)
cd web && bun install --frozen-lockfile && bun run build && cd ..

# 4. Backend
go mod download
go build ./...

# 5. Dev stack (PostgreSQL + API)
make dev-api          # docker compose up
make dev-web          # frontend dev server (hot reload)
# OR
make dev              # both
```

## Scenarios

| Goal | Command |
|------|---------|
| Full dev stack (Docker) | `make dev` |
| Backend only (Docker) | `make dev-api` |
| Frontend dev server | `make dev-web` |
| Backend local (no Docker) | `go run main.go` |
| Rebuild backend container | `make dev-api-rebuild` |
| Reset setup wizard | `make reset-setup` |
| Run all tests | `make test` |
| Frontend tests | `cd web && bun run test` |
| Guard checks | `./scripts/guard.sh` |
| Full local CI | `./scripts/ci-local.sh` |

## Gotchas

1. **web/dist must exist** before `go build` — the binary embeds it via `//go:embed`.
   Create a placeholder: `mkdir -p web/dist && touch web/dist/index.html`.
2. **GOWORK=off** — the root module and `relaykit/` are independent. Build commands need
   `GOWORK=off` or use the Makefile which handles this.
3. **relaykit independence** — `cd relaykit && GOWORK=off go build ./...` must pass separately.
   Never import root-module packages from relaykit.
4. **SQLite is default** — if no `SQL_DSN` is set, the app uses `one-api.db` (SQLite). For
   development with PostgreSQL, use `make dev-api` which starts a Docker PostgreSQL.
5. **Port 3000** — default API port. Override with `PORT` env var.
6. **Go 1.25** — the go.mod specifies 1.25.1. Make sure your SDK matches.

## Verification

After setup, the following must all succeed:

```bash
go build ./...                                    # clean build
cd relaykit && GOWORK=off go build ./... && cd ..  # relaykit builds independently
make test                                         # all Go tests pass
./scripts/guard.sh --static-only                  # static checks pass
```
