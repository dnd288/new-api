---
name: napi-review
description: >-
  Review gate for new-api changes: correctness, architecture, security, billing safety
---

# napi-review

## Axes

### 1. Correctness

- Does it do what it claims?
- Are edge cases handled (nil, zero, overflow, empty string)?
- For relay: does the upstream format match the provider's actual API?
- For billing: does the full chain preserve invariants (no negative charge, no overflow)?

### 2. Architecture

- Layered architecture respected: Router → Controller → Service → Model.
- `relaykit/` independence: no imports from root module.
- JSON through `common/json.go` — no direct `encoding/json`.
- Quota through `common/quota_math.go` — no bare `int()` casts.
- Database code works on all three backends.
- `lockForUpdate(tx)` — no legacy GORM v1 locking.

### 3. Security

- No credentials in source.
- No user input passed unsanitized to SQL (GORM methods preferred).
- JWT/session/auth changes reviewed for bypass paths.
- Billing multiplier fields bounded before quota calculation.
- Passthrough fields, metadata maps, and multipart forms checked for validation bypass.

### 4. Billing safety

Every billing path must preserve these invariants:
- No negative charge from overflow or unvalidated input.
- User-controlled quantities bounded before reaching quota calculation.
- `*Checked` variants used for auditability.
- Pre-consume and settle both safe (oversized quota fails, never wraps).

### 5. Test quality

- Tests protect real behavior, not coverage numbers.
- No fake fuzz/stress tests with random inputs.
- No duplicate tests exercising the same branch.
- Deterministic table tests with explicit inputs/outputs.
- `stretchr/testify` (require for fatal, assert for non-fatal).

## What guards cannot see

- Whether the upstream provider actually supports the claimed feature.
- Whether the billing expression produces correct amounts for real-world usage.
- Whether the database migration is safe on a production-sized table.
- Whether the relay adapter handles all variants of a provider's error format.
- Whether a UI change looks correct in all themes and languages.

## Approval standard

A change is ready when:
1. All five axes are satisfied.
2. `./scripts/ci-local.sh` passes.
3. `relaykit/` builds independently (if touched).
4. PR uses `.agents/github/PR.md` template with all sections filled.

## Protected content

Per AGENTS.md § Project Governance: references to **new-api** and **QuantumNous** are protected.
A change that removes, renames, or replaces these is rejected.
