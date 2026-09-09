# Tasks: Per-model minimum charge
## Implementation Order
Test-first. Dependency order: model → service → controller → relay → frontend.
### Task 1: Persist and validate the model policy
- File: `setting/billing_setting/tiered_billing.go`, `model/model_pricing_config.go`
- Test: `controller/model_management_test.go` — minimum-charge round trip; billing setting test — quota boundaries
- [x] Write failing test
- [x] Implement
- [x] Guard passes
### Task 2: Carry policy through request billing
- File: `types/price_data.go`, `relay/helper/price.go`
- Test: `relay/helper/price_test.go` — pre-consume floors positive quotas
- [x] Write failing test
- [x] Implement
- [x] Guard passes
### Task 3: Apply policy at settlement
- File: `service/text_quota.go`, `service/quota.go`, `service/task_billing.go`, `model/task.go`, `controller/relay.go`
- Test: `service/text_quota_test.go` and `service/task_billing_test.go` — synchronous and asynchronous settlement boundaries
- [x] Write failing test
- [x] Implement
- [x] Guard passes
### Task 4: Add model pricing checkbox
- File: `web/src/features/model-pricing/pricing.ts`, `web/src/features/system-settings/models/model-pricing-core.ts`, `model-pricing-snapshots.ts`, `model-pricing-sheet.tsx`
- Test: `web/src/features/model-pricing/__tests__/editor-minimum-charge.test.tsx` — toggle and commit behavior
- [x] Write failing test
- [x] Implement
- [x] Guard passes
### Task 5: Translate UI copy
- File: `web/src/i18n/locales/*.json` through `web/scripts/add-missing-keys.mjs`
- Test: `bun run i18n:sync` — all locales contain the keys
- [x] Add translations through script
- [x] Run sync
- [x] Remove temporary script
## Final Verification
- [x] Focused Go billing and model-pricing tests
- [x] Focused frontend interaction test
- [x] `./scripts/guard.sh --static-only`
- [ ] `make test` — not run; focused affected suites passed
- [ ] `cd web && bun run test` — existing unrelated task-editor failures remain
- [ ] `cd web && bun run typecheck` — blocked by pre-existing wallet errors
- [ ] Browser verification — frontend rendered, but the model-pricing page requires an authenticated super administrator
- [ ] relaykit build not required because relaykit is untouched
