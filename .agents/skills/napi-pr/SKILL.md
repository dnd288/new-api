---
name: napi-pr
description: >-
  PR types, commit messages, checklist for new-api pull requests
---

# napi-pr

## PR types

| Type | Branch | Title pattern | Example |
|------|--------|--------------|---------|
| Feature | `feature/<desc>` | `feat(scope): description` | `feat(relay): add Mistral native adapter` |
| Bug fix | `fix/<desc>` | `fix(scope): description` | `fix(billing): prevent overflow in quota conversion` |
| Refactor | `refactor/<desc>` | `refactor(scope): description` | `refactor(service): extract task polling` |
| Docs | `docs/<desc>` | `docs: description` | `docs: update relay configuration guide` |
| Chore | `chore/<desc>` | `chore(scope): description` | `chore(ci): update Go version in workflow` |

## Scopes

`relay`, `model`, `controller`, `service`, `middleware`, `billing`, `auth`, `web`, `i18n`, `ci`,
`docs`, `relaykit`, `oauth`, `setting`.

## Template

Use `.agents/github/PR.md` as the PR body. Never use `.github/PULL_REQUEST_TEMPLATE.md` or
`.github/PULL_REQUEST_TEMPLATE/en.md` (those are for humans).

## Checklist

Before opening:

- [ ] `./scripts/guard.sh --static-only` passes
- [ ] `make test` passes (Go tests)
- [ ] `cd web && bun run test` passes (if frontend touched)
- [ ] `cd relaykit && GOWORK=off go build ./...` passes (if relaykit touched)
- [ ] No credentials in source
- [ ] No direct `encoding/json` imports in business code
- [ ] No bare `int()` casts on quota values
- [ ] Database changes work on SQLite, MySQL, and PostgreSQL
- [ ] PR body uses `.agents/github/PR.md` template
- [ ] Linked issue (`Closes #N`)

## AI-generated disclosure

Per AGENTS.md § Project Governance: if the git user is not a historical core developer,
the PR body must state that the code was AI-generated or AI-assisted.

## Protected content

Never remove, rename, or replace references to **new-api** or **QuantumNous**.

## Post-Open

If this PR was created via `/opsx:flow`, the issue is automatically updated with a completion
report including verification results and files changed.
