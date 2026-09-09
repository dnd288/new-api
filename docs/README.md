# Documentation

## By Role

| If you are... | Read |
|---------------|------|
| New to the project | [../README.md](../README.md) — features, setup, run |
| Confused by a term | [../CONTEXT.md](../CONTEXT.md) — domain glossary |
| Making a change | [../CONTRIBUTING.md](../CONTRIBUTING.md) — workflow, conventions |
| Reviewing code | [../AGENTS.md](../AGENTS.md) § Boundaries + `napi-review` skill |
| Fixing a defect | `napi-bugfix` skill |
| Writing tests | `napi-tdd` skill |
| Setting up locally | `napi-local-dev` skill |

## Architecture Decisions

Records in `adr/`. Each captures context, decision, rationale, alternatives, consequences,
reversibility, and status.

- [ADR-0001](adr/0001-go-gin-gorm-stack.md) — Why Go + Gin + GORM

## Engineering

- [conventions.md](engineering/conventions.md) — code conventions extracted from AGENTS.md
- [security.md](engineering/security.md) — security surfaces, controls, and gaps
