---
name: napi-bugfix
description: >-
  5-step defect loop for new-api: inspect → debug → impact → fix → verify
---

# napi-bugfix

## When

A defect whose cause is not obvious from the symptom. Copy fixes and one-line typos go straight
to a pull request.

## Loop

### 1. Inspect

Read the symptom. Identify the layer: relay, billing, model, controller, service, middleware,
frontend. Find the entry point and trace the data flow.

Evidence discipline: every claim carries the observation that proves it. "The handler returns 500"
means you found the line and the condition.

### 2. Debug

Reproduce. Write down the reproduction steps and the observed output.

For relay bugs: compare the request sent directly upstream with the same request through new-api.
The delta is the bug's surface.

For billing bugs: trace the full chain — validation → EstimateBilling/OtherRatios → quota
conversion → pre-consume → settle/refund.

For database bugs: test against all three backends (SQLite, MySQL, PostgreSQL) when the fix
touches raw SQL or migration code.

### 3. Impact

What else relies on the thing being changed? Search callers, check all three database backends,
check the relay adapters that share the code path.

A billing fix must not introduce a negative charge. A relay fix must not break pass-through mode.
A model migration must work on all three databases.

### 4. Fix

Test first. Write a failing test that demonstrates the defect, then fix the code until the test
passes. Use `stretchr/testify` (require for fatal, assert for non-fatal).

Keep the fix focused. One bug, one PR.

### 5. Verify

```bash
./scripts/guard.sh --static-only   # static checks
make test                          # all Go tests
cd web && bun run test             # frontend (if touched)
```

If the fix touches relay: test the specific provider path.
If the fix touches billing: verify no overflow, no negative charge.
If the fix touches database: verify on all three backends.

## Red Flags

- Fix changes a public API contract without updating `dto/` and documentation.
- Fix introduces a new `encoding/json` import (must use `common/json.go`).
- Fix adds a bare `int()` cast on a quota/billing value.
- Fix changes `relaykit/` without verifying independent build.
