# Tasks: voucher-topup-and-remove-export

## Implementation Order

Test-first on the new frontend module; backend removal is pure deletion verified by build +
existing tests. Dependency order: model → controller → router → frontend.

### Task 1: Remove the Go export feature

- Files: `model/topup.go`, `controller/topup_mezon_report.go`,
  `controller/assets/fonts/`, `router/api-router.go`, `go.mod`, `go.sum`
- Test: regression — `go test ./controller/ -run 'TestRequestMezonPay|TestMezon'` stays
  green; `go build ./...` proves the symbols are gone
- [ ] Cut `MezonTopUpReportRow` + `GetMezonTopUpReport` from `model/topup.go`
- [ ] Delete `controller/topup_mezon_report.go` and `controller/assets/fonts/`
- [ ] Remove the `adminRoute.GET("/topup/mezon/report", …)` line
- [ ] `go mod tidy` (drops `gofpdf`); guard passes

### Task 2: Voucher catalog module (test-first)

- File: `web/src/features/wallet/lib/vouchers.ts`
- Test: `web/src/features/wallet/__tests__/vouchers.test.ts` — `voucher catalog`
- [ ] Write failing test asserting the six fixed denominations, ascending order, and
      existing `/vouchers/*.svg` paths
- [ ] Implement `VOUCHER_DENOMINATIONS`; test green

### Task 3: VoucherSection component (test-first)

- Files: `web/src/features/wallet/components/voucher-section.tsx`,
  `components/recharge-form-card.tsx`, delete `components/mezon-topup-section.tsx`
- Test: `web/src/features/wallet/__tests__/voucher-section.test.tsx` —
  `VoucherSection/selecting a voucher shows its amount and keeps the claim input`
- [ ] Write failing render test (6 vouchers, click selects, instruction shows amount,
      claim input + handler still present)
- [ ] Implement `VoucherSection` (grid + QR/copy/explorer/find-transactions/claim panel
      carried over from `MezonTopupSection`), wire into `RechargeFormCard`
- [ ] Test green

### Task 4: Remove the topup-reports frontend feature

- Files: `web/src/features/topup-reports/` (delete),
  `web/src/routes/_authenticated/topup-reports/index.tsx` (delete),
  `web/src/hooks/use-sidebar-data.ts`, `web/src/hooks/use-sidebar-config.ts`
- Test: `bun run build` regenerates `routeTree.gen.ts` without `/topup-reports`
- [ ] Delete feature directory and route file
- [ ] Remove sidebar item, `admin.topup` module key, `/topup-reports` URL mapping,
      unused `FileSpreadsheet` import
- [ ] i18n: add voucher keys, prune orphaned report keys in all locales (`i18n-translate`
      skill + `bun run i18n:sync`)

### Task 5: Full verification

- [ ] `./scripts/guard.sh --static-only`
- [ ] `make test`
- [ ] `cd web && bun run test`
- [ ] `cd web && bun run build`
- [ ] Dev-server probe: `/api/user/topup/mezon/report` → 404, `/topup-reports` → not found,
      wallet renders 6 vouchers (screenshot)

## Final Verification

- [ ] `./scripts/guard.sh --static-only`
- [ ] `make test`
- [ ] `cd web && bun run test` (frontend touched)
- [ ] `cd relaykit && GOWORK=off go build ./...` (not touched — skipped)
