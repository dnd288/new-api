# Tasks: <defect-name>

## Fix Steps

Test-first: write failing test that demonstrates the defect, then fix.

### Task 1: Write failing test

- File: `path/to/file_test.go`
- Test: `TestName/case_description`
- [ ] Test written and fails (RED)

### Task 2: Fix the defect

- File: `path/to/file.go`
- [ ] Fix applied
- [ ] Test passes (GREEN)

### Task 3: Verify side effects

- [ ] `./scripts/guard.sh --static-only`
- [ ] `make test`
- [ ] No other tests broken
