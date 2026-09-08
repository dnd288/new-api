# Proposal: voucher-topup-and-remove-export

## Summary

Replace the free-form Mezon đồng top-up section in the wallet with a fixed-denomination
voucher catalog (10.000 / 20.000 / 50.000 / 100.000 / 200.000 / 500.000 đồng, artwork in
`web/public/vouchers/`). Selecting a voucher walks the user through transferring exactly that
amount to the treasury wallet, then claiming via the existing Mezon pay endpoint. Remove the
admin monthly top-up export feature end to end (backend handler, model query, route, frontend
page, sidebar entry, `gofpdf` dependency).

## User-Visible Behavior

- Wallet → Add Funds: the Mezon Đồng section now renders 6 voucher cards with the generated
  artwork instead of a bare "transfer any amount" instruction.
- Picking a voucher pins the transfer amount in the instructions ("transfer exactly X đồng"),
  keeps the treasury QR / copy-address / explorer / find-my-transactions helpers, and the
  existing transaction-hash claim input. Backend crediting logic is unchanged: the indexer
  verifies the real transferred amount and credits 1 dong = 1 mzđ.
- Admin sidebar no longer shows "Mezon Top-up Reports"; `/topup-reports` and
  `GET /api/user/topup/mezon/report` are gone.
- Redemption codes, billing history, and other payment rails (epay/stripe/creem/waffo, all
  config-gated) are untouched.

## Layers Affected

- [ ] relay/ — provider adapter
- [x] model/ — remove `MezonTopUpReportRow` / `GetMezonTopUpReport` (no schema change)
- [ ] service/ — business logic
- [x] controller/ — remove `ExportMezonTopUpReport` + embedded fonts
- [ ] middleware/ — auth/rate-limit/CORS
- [ ] billing — quota/pricing (unchanged; existing `mezonDongToQuota` path reused)
- [x] web/ — wallet voucher section, delete topup-reports feature, sidebar config
- [ ] relaykit/ — relay conversion utilities (not affected)

## Constraints

- Database compatibility: SQLite + MySQL + PostgreSQL — no migration; the removed query was
  the only custom `top_ups` join, no dialect-specific SQL remains behind.
- relaykit independence: not affected (`relaykit/` untouched).
- Billing safety: unchanged — crediting still goes through `mezonDongToQuota` with the
  existing `common.QuotaRoundChecked` saturation and per-user quota-limit checks.
- Protected content: new-api and QuantumNous references preserved.

## Acceptance Criteria

1. Wallet shows exactly 6 vouchers: 10k, 20k, 50k, 100k, 200k, 500k đồng, each with its
   generated artwork from `web/public/vouchers/`.
2. Selecting a voucher updates the transfer instructions with that exact amount; claiming a
   transaction hash still works through `POST /api/user/topup/mezon/pay` and credits 1:1.
3. `GET /api/user/topup/mezon/report` no longer exists (404); `ExportMezonTopUpReport`,
   `GetMezonTopUpReport`, the report fonts, and the `gofpdf` dependency are removed.
4. `/topup-reports` page, its feature directory, and its sidebar entry are removed;
   `routeTree.gen.ts` no longer references them.
5. Backend tests, guard checks, frontend tests, and production build all pass.
