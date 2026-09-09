# Design: Per-model minimum charge
## Approach
Add `billing_setting.minimum_charge` as a per-model boolean map managed with existing model-pricing options. Resolve the setting using the billing model name, copy it into `PriceData`, and apply a single host-side `ApplyMinimumCharge` function after the complete request charge—including expression results, group/other ratios, audio, and tool surcharges—is known. Apply it to pre-consume estimates and final settlement. Persist the resolved boolean in asynchronous task billing context so later configuration changes cannot alter an in-flight task.
## Packages and Files
| Package | File | Change |
|---------|------|--------|
| setting/billing_setting | `tiered_billing.go` | Register/read the per-model boolean map and provide the pure quota-floor operation. |
| model | `model_pricing_config.go` | Include and validate the boolean option in pricing snapshots and atomic updates. |
| types | `price_data.go` | Carry the resolved minimum-charge flag on request billing state. |
| relay/helper | `price.go` | Resolve the model setting and floor pre-consume quota after all configured ratios. |
| service | `text_quota.go`, `quota.go`, `task_billing.go` | Floor final synchronous and async calculated quota at the settlement boundary. |
| model | `task.go` | Snapshot the optional task policy. |
| controller | `relay.go`, `option.go` | Persist task snapshot and expose effective option values. |
| web | model pricing core/snapshot/editor files | Round-trip the boolean and render the existing shared Checkbox control. |
| web i18n | locale files via the mandated script | Translate label and description in seven locales. |
## Interfaces
`billing_setting.MinimumChargeEnabled(model string) bool` resolves the configured policy. `billing_setting.ApplyMinimumCharge(quota int, enabled bool) int` returns 10 only for enabled positive values below 10 and otherwise returns the input unchanged. `types.PriceData.MinimumCharge` and `model.TaskBillingContext.MinimumCharge` carry immutable request-local state.
## Database
No migration. The boolean map is serialized into an existing `options` row, and the task snapshot is an optional field in the existing JSON column. Missing values decode as false on SQLite, MySQL, and PostgreSQL. No SQL or dialect behavior changes.
## Relay Adapter
Not applicable. No provider payload or stream capability changes.
## Billing
Validation accepts only booleans for `billing_setting.minimum_charge`. Model pricing resolution attaches the flag. Legacy ratio, fixed per-request, and expression estimates are converted with existing strict quota helpers, then floored before pre-consume. Synchronous usage computes the full charge, including tool surcharge, then floors it before `SettleBilling`. Expression settlement is floored after group ratio and surcharge composition. Task submission snapshots the flag; any successful recalculation floors the final actual quota before delta settlement. Zero/free/failure paths remain zero or fully refunded.
## Dependencies
Uses the existing config registry, model-pricing transaction, shared Checkbox, quota conversion helpers, and billing session. No new package or relaykit dependency.
