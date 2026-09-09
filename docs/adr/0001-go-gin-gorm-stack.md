# ADR-0001: Go + Gin + GORM Stack

## Status

Accepted (inherited from upstream QuantumNous/new-api)

## Context

new-api is an AI API gateway/proxy serving as a unified interface to 40+ upstream AI providers.
It needs to handle high-throughput streaming (SSE) relay, multi-database support, and embed a
frontend SPA in a single binary.

## Decision

- **Go** as the backend language
- **Gin** as the HTTP framework
- **GORM v2** as the ORM
- **React 19 + Rsbuild** for the admin frontend, embedded via `//go:embed`
- **Bun** as the frontend package manager

## Rationale

- Go's goroutine model handles concurrent SSE streams efficiently.
- Single binary deployment (with embedded frontend) simplifies Docker images and distribution.
- GORM's multi-database support (SQLite, MySQL, PostgreSQL) allows flexible deployment.
- Gin's middleware pattern maps cleanly to auth, rate limiting, CORS, and relay concerns.
- Bun's speed reduces frontend build times for the embedded build step.

## Alternatives

- **Node.js/TypeScript** — higher-level but more memory, less natural for single-binary embedding.
- **Rust** — performance gains not needed for a proxy; development speed matters more.
- **Python (FastAPI)** — GIL limits concurrency for streaming; less natural for binary distribution.

## Consequences

- All JSON marshal/unmarshal must go through `common/json.go` (custom wrapper over `sonic`/`encoding/json`).
- Database code must work on all three backends simultaneously.
- Frontend changes require a `bun run build` step before Go compilation.
- `relaykit/` must remain independently buildable as a separate Go module.

## Reversibility

Not reversible — the entire codebase is Go. Individual components (ORM, framework) could be
swapped but at significant cost.
