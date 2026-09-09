# Proposal: Per-model minimum charge
## Summary
Super administrators can enable a minimum charge for an individual model. When enabled, every successful billable request for that model costs at least 10 quota; requests whose calculated charge is already at least 10 quota keep their calculated charge. This avoids the discontinuity and request-splitting incentive created by a separate surcharge above a threshold.
## User-Visible Behavior
The model pricing editor shows a “Minimum charge” checkbox. Enabling it persists the policy with that model’s pricing. A successful request with a positive calculated charge below 10 quota is charged 10 quota. Free, failed, and otherwise non-billable requests remain uncharged. Usage at or above 10 quota is unchanged.
## Layers Affected
- [ ] relay/ — provider adapter
- [x] model/ — model-pricing configuration snapshot and validation
- [x] service/ — final billing settlement
- [x] controller/ — model-pricing option exposure through the existing handler
- [ ] middleware/ — auth/rate-limit/CORS
- [x] billing — pre-consume and final quota policy
- [x] web/ — frontend model pricing editor
- [ ] relaykit/ — relay conversion utilities
- [ ] other:
## Constraints
- Database compatibility: SQLite + MySQL + PostgreSQL; this uses the existing option map and adds no schema or SQL changes.
- relaykit independence: relaykit is not affected.
- Billing safety: apply the floor only to positive, billable quota; preserve zero-charge semantics; use existing bounded quota integers; apply the same policy to pre-consume and settlement; snapshot the setting for asynchronous tasks.
- Protected content: new-api and QuantumNous references preserved.
## Acceptance Criteria
1. Super administrators can independently enable or disable a 10-quota minimum for each model in the model pricing editor.
2. With the policy enabled, a positive calculated charge from 1 through 9 quota settles as 10; 10 and larger values are unchanged; zero remains zero.
3. Pre-consume, synchronous settlement, expression billing, and asynchronous task settlement use the same per-request policy without creating a credit or bypassing free/failure refunds.
4. Saving, resetting, bulk model-pricing operations, and optimistic version checks include the new setting.
5. The checkbox and description are translated for all supported frontend locales.
