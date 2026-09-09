# Verification: Per-model minimum charge
## Test Evidence
### RED (before implementation)
```
setting/billing_setting/builtin_billing_test.go:37:45: undefined: billing_setting.ApplyMinimumCharge
FAIL github.com/QuantumNous/new-api/setting/billing_setting [build failed]
```
### GREEN (after implementation)
```
BUILD_OK (go build ./...)
ok github.com/QuantumNous/new-api/setting/billing_setting
ok github.com/QuantumNous/new-api/relay/helper
ok github.com/QuantumNous/new-api/service
ok github.com/QuantumNous/new-api/controller
ok github.com/QuantumNous/new-api/model
ok github.com/QuantumNous/new-api/common

web full suite: 888 passed | 1 failed
model-pricing suites: Test Files 2 passed (2), Tests 32 passed (32)
```
Focused cases covered the floor boundaries, model-pricing persistence, ratio pre-consume, asynchronous task snapshot settlement, frontend mapping, and accessible checkbox commit.
## Guard Output
```
Checking for credential patterns in Go source... PASS
Checking for NEW direct encoding/json imports... PASS
Checking for NEW bare int() casts on quota values... PASS
Checking for NEW legacy GORM v1 locking patterns... PASS
Running OpenSpec validate... change/per-model-minimum-charge PASS
All checks passed.
```
## Databases Tested
- [x] SQLite — `TestModelManagementDatabaseMatrix/sqlite` passed.
- [ ] MySQL — no `TEST_MYSQL_DSN` was available; no SQL/schema behavior changed.
- [ ] PostgreSQL — no `TEST_POSTGRES_DSN` was available; no SQL/schema behavior changed.
## Providers Tested
Not applicable. The change is host-side billing policy and does not modify provider relay payloads.
## Not Tested
- Authenticated visual interaction: the development UI rendered successfully, but the protected model-pricing page redirected to sign-in and no administrator credentials were available.
- MySQL and PostgreSQL legs of the pricing matrix are skipped because no test DSN is configured; the change adds no SQL, schema, or migration behavior.
- On the local integration branch (which also carries the unmerged voucher commits), three pre-existing frontend typecheck errors were repaired out-of-tree (restored `TopupStatus`/`create_time` in `wallet/types.ts`, re-added the `CreemProductsSection` import) and one pre-existing `task-price-display` test failure remains; none of these exist on this PR's base and none belong to this change.
