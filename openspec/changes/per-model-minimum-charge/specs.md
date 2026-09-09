# Specifications: Per-model minimum charge
## Scenarios
### Scenario 1: Enabled policy floors a positive charge
**Given** a model has minimum charge enabled
**When** its request produces a final billable charge between 1 and 9 quota
**Then** pre-consume and settlement charge exactly 10 quota
*Test:* `TestApplyMinimumCharge/enabled_positive_below_minimum`

### Scenario 2: Enabled policy preserves boundary and larger charges
**Given** a model has minimum charge enabled
**When** its calculated charge is 10 quota or greater
**Then** the calculated charge is unchanged
*Test:* `TestApplyMinimumCharge/enabled_at_or_above_minimum`

### Scenario 3: Zero and disabled policies remain unchanged
**Given** a free or non-billable request, or a model without minimum charge enabled
**When** billing computes zero or any positive charge
**Then** zero remains zero and disabled models keep the original charge
*Test:* `TestApplyMinimumCharge/zero_and_disabled`

### Scenario 4: Model pricing round trip
**Given** a super administrator edits a model price
**When** the minimum charge checkbox is enabled and saved
**Then** the model pricing API persists and returns the per-model boolean, and reset removes the explicit setting
*Test:* `TestUpdateModelPricing/minimum_charge_round_trip`

### Scenario 5: Editor exposes an accessible checkbox
**Given** the model pricing editor loads a model
**When** the administrator toggles Minimum charge and commits the draft
**Then** the checkbox has a localized accessible name and the draft contains the selected policy
*Test:* `editor-minimum-charge.test.tsx/toggles_and_commits_minimum_charge`

### Scenario 6: Asynchronous task keeps submission policy
**Given** a task is submitted while the model policy is enabled
**When** pricing configuration changes before polling settlement
**Then** the task settlement uses the policy snapshot captured at submission
*Test:* `TestTaskMinimumChargeUsesBillingSnapshot`

## Edge Cases
### Overflow / zero / nil
The policy compares an already bounded integer quota and replaces only values from 1 through 9 with 10; it performs no addition or multiplication and cannot overflow. Nil billing context and legacy tasks default to disabled.
*Test:* `TestApplyMinimumCharge/max_quota_and_zero`

### Database dialect differences
No database schema, raw SQL, GORM tag, migration, or driver behavior changes. The setting is stored in existing option rows and task JSON; no dialect-specific test matrix is required.

## Not Covered
- The earlier 5-quota surcharge above 20 quota; it creates a discontinuity and is not part of the selected minimum policy.
- Aggregate minimums across multiple requests or billing periods.
- Provider relay payloads; the policy is host-side billing metadata and is never passed upstream.
