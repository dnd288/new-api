# Tasks: <change-name>

## Implementation Order

Test-first. Dependency order: model → service → controller → relay → frontend.

### Task 1: <description>

- File: `path/to/file.go`
- Test: `path/to/file_test.go` — `TestName`
- [ ] Write failing test
- [ ] Implement
- [ ] Guard passes

### Task 2: <description>

- File: `path/to/file.go`
- Test: `path/to/file_test.go` — `TestName`
- [ ] Write failing test
- [ ] Implement
- [ ] Guard passes

## Final Verification

- [ ] `./scripts/guard.sh --static-only`
- [ ] `make test`
- [ ] `cd web && bun run test` (if frontend touched)
- [ ] `cd relaykit && GOWORK=off go build ./...` (if relaykit touched)
