---
name: napi-tdd
description: >-
  Test-first discipline for new-api: Go (testify) and React (vitest) patterns
---

# napi-tdd

## RED → GREEN cycle

1. **RED** — Write a failing test that describes the expected behavior.
2. **GREEN** — Write the minimum code to make it pass.
3. **REFACTOR** — Clean up without changing behavior. Tests stay green.

## Backend (Go)

### Framework

- `stretchr/testify/require` — fatal assertions (setup, preconditions).
- `stretchr/testify/assert` — non-fatal value checks.
- Never hand-written assertion helpers unless encoding a reusable project-specific invariant.

### Style

Prefer deterministic table tests with explicit inputs and exact expected outputs:

```go
tests := []struct {
    name     string
    input    SomeInput
    expected SomeOutput
}{
    {"case one", input1, output1},
    {"case two", input2, output2},
}
for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        got := DoThing(tt.input)
        assert.Equal(t, tt.expected, got)
    })
}
```

### What to test

- Real behavior, API contracts, billing/accounting invariants, regression paths.
- Request endpoint behavior (controller/handler tests).
- Quota conversion edge cases (overflow, zero, negative).
- Database compatibility (all three backends when touching raw SQL).
- Relay adapter correctness (request/response transformation).

### What NOT to test

- Coverage-only tests that prove code happens to run.
- Implementation details (which internal method was called).
- Random/fuzz inputs without invariant assertions.
- Private constants or select-field lists.
- Timing-based or sleep-based assertions.

### Database tests

When tests need database state, initialize it explicitly inside the test fixture. Do not rely on
global state or seed data.

### relaykit tests

Must pass independently: `cd relaykit && GOWORK=off go test ./...`

## Frontend (React/TypeScript)

### Framework

- `vitest` — test runner
- `bun run test` — run all frontend tests

### What to test

- Component behavior (user interactions, rendered output).
- Hook logic (state transitions, side effects).
- Utility functions (pure transformations).
- i18n key existence and fallback behavior.

## Mode-to-claim mapping

| Claim about | Test with |
|-------------|-----------|
| Go business logic | `go test ./...` (table tests, testify) |
| Relay transformation | Unit test the adapter's marshal/unmarshal |
| Billing invariants | `common/quota_math_test.go` style |
| Database compatibility | Test against SQLite (default) |
| API contract | Controller test with httptest |
| Frontend component | vitest + React Testing Library |
| Frontend integration | vitest with mock API |
| Full system | Docker compose + manual verification |

## Verification

```bash
make test               # all Go tests (root + relaykit)
cd web && bun run test  # frontend tests
```
