# Verification: voucher-topup-and-remove-export

## Test Evidence

### RED (before implementation)

New test files against a tree without `lib/vouchers.ts` / `voucher-section.tsx`:

```
 Test Files  2 failed (2)
      Tests  no tests
error: script "test" exited with code 1
```
(Failed at transform stage: `Cannot find module '../lib/vouchers'`,
`Cannot find module '../components/voucher-section'` — LSP diagnostics confirmed both.)

### GREEN (after implementation)

```
 Test Files  2 passed (2)
      Tests  5 passed (5)
```
- `voucher catalog/has the six fixed denominations in ascending order`
- `voucher catalog/maps every denomination to an existing bundled voucher image`
- `voucher catalog/formats amounts with Vietnamese thousands separators`
- `VoucherSection/renders the six voucher denominations and no selection by default`
- `VoucherSection/pins the exact amount after selection and still claims via the hash input`

## Guard Output

```
$ ./scripts/guard.sh --static-only
Checking for NEW bare int() casts on quota values... PASS
Checking for NEW legacy GORM v1 locking patterns... PASS
Running OpenSpec validate... PASS (change/voucher-topup-and-remove-export valid)
All checks passed.
```

## Additional Commands Run

- `go build ./...` — OK after deleting `controller/topup_mezon_report.go`; `go mod tidy`
  dropped `github.com/jung-kurt/gofpdf/v2` from `go.mod` (`go mod why` confirms the main
  module no longer needs it; remaining `go.sum` entries are unrelated go.mod hashes of
  same-name modules in the graph).
- `go test ./... -count=1` (root module, SQLite) — exit 0, all packages pass, including
  the Mezon regression tests `controller/topup_mezon_test.go`.
- `cd web && bun run test` — 870 passed, 3 failed. The 3 failures
  (`dashboard/lib/__tests__/quick-setup.test.ts`,
  `model-pricing/__tests__/editor-currency.test.tsx`,
  `pricing/__tests__/task-price-display.test.tsx`) were re-run against a clean `main`
  worktree and fail identically there (pre-existing from the upstream merge, untouched by
  this change).
- `cd web && bun run build` — OK; regenerated `routeTree.gen.ts` contains 0 references to
  `topup-reports`.

## Dev-Server Probe (Docker dev stack, rebuilt image)

- `GET /api/user/topup/mezon/report?year=2026&month=8` → **404** (was 401 on the old
  binary before rebuild — route removal proven).
- `GET /api/status` → 200.
- `/topup-reports` in the browser → 404 not-found UI.
- `/wallet` renders the voucher grid: images with alts `10.000 đồng`, `20.000 đồng`,
  `50.000 đồng`, `100.000 đồng`, `200.000 đồng`, `500.000 đồng`; prompt
  "Select a voucher to top up".
- Clicking the 50.000 voucher: `aria-pressed` moves to it and the prompt becomes
  "Transfer exactly 50.000 đồng (1 đồng = 1 mzđ) from your bound Mezon wallet."; claim
  input `#mezon-tx-hash` and Claim button present (screenshot taken).
- Locale `vi`: prompt renders "Chọn voucher để nạp"; section label "Mezon Đồng".
- Admin sidebar no longer shows "Mezon Top-up Reports" (visible in the same screenshot).
- Dev-only env setup for the probe: seeded `MezonPaymentEnabled=true`,
  `MezonProviderId=1`, `MezonTreasuryAddress` (prod value) and
  `payment_setting.compliance_*` options into the dev Postgres, then restarted the dev
  API container.

## Databases Tested

- [x] SQLite (via `go test ./...` default)
- [ ] MySQL — not applicable: no SQL or schema change; the only custom join was deleted
- [ ] PostgreSQL — exercised indirectly by the dev-stack probe (no schema change)

## Providers Tested

Not a relay change — no upstream provider exercised.

## Not Tested

- A live MMN chain claim (requires a real on-chain transaction from a bound wallet); the
  claim path itself is unchanged and covered by existing `controller/topup_mezon_test.go`.
- MySQL/PostgreSQL databases (deletion-only change, no query surface touched).
- The three pre-existing frontend failures listed above (out of scope for this change).
