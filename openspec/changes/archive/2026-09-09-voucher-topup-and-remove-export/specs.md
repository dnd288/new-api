# Specifications: voucher-topup-and-remove-export

## Scenarios

### Scenario 1: Voucher catalog is fixed at 6 denominations

**Given** the wallet voucher feature module
**When** the catalog is imported
**Then** it contains exactly the values 10000, 20000, 50000, 100000, 200000, 500000 (đồng),
in ascending order, each mapping to an existing SVG under `/vouchers/`.

*Test:* `web/src/features/wallet/__tests__/vouchers.test.ts` — `voucher catalog/has the six fixed denominations`

### Scenario 2: Selecting a voucher drives the claim flow

**Given** the voucher section is rendered with the treasury address
**When** the user clicks a voucher
**Then** that voucher is marked selected, the transfer instruction shows that exact amount,
and the claim action posts the pasted hash to the existing Mezon pay endpoint
(`claimMezonTopup` → `POST /api/user/topup/mezon/pay`) without any new backend contract.

*Test:* `web/src/features/wallet/__tests__/voucher-section.test.tsx` — `VoucherSection/selecting a voucher shows its amount and keeps the claim input`

### Scenario 3: Backend crediting stays amount-agnostic

**Given** a user bound to the Mezon OAuth provider transfers any positive đồng amount and
claims its hash
**Then** `RequestMezonPay` credits the actual indexer-reported amount at 1:1 — voucher choice
is presentation only, and overflow / quota-limit / duplicate-hash guards still apply.

*Test:* existing `controller/topup_mezon_test.go` (regression — must stay green)

### Scenario 4: Export feature is fully removed

**Given** the removal is applied
**When** the tree is built and the dev server is probed
**Then** `GET /api/user/topup/mezon/report` returns 404 (route unregistered), the Go symbols
`ExportMezonTopUpReport` / `GetMezonTopUpReport` no longer exist, `gofpdf` is absent from
`go.mod`, and `/topup-reports` no longer resolves in the frontend router.

*Test:* `go build ./...` + `./scripts/guard.sh --static-only` + `bun run build` (compile-level
proof) and a manual dev-server probe recorded in `verification.md`.

## Edge Cases

### Overflow / zero / nil

Unchanged by design: voucher selection never reaches quota math; the credit path keeps its
existing saturation and positive-amount guards (`mezonDongToQuota`,
`ErrTopUpQuotaLimitExceeded`).

*Test:* covered by existing `controller/topup_mezon_test.go` and `model` topup tests.

### Database dialect differences

The deleted `GetMezonTopUpReport` contained the only hand-written `top_ups ⋈ users` join.
No new SQL is introduced, so no new dialect surface exists.

*Test:* (not applicable — deletion only)

## Not Covered

- Selling vouchers through an external voucher-code vendor: out of scope; vouchers here are
  presentation over the Mezon transfer rail.
- Removing epay/stripe/creem/waffo rails: out of scope; they are config-gated and untouched.
- Backend validation that a claimed transaction amount equals the selected voucher amount:
  intentionally omitted — the indexer reports the true amount and crediting is 1:1, so a
  mismatched transfer credits what was actually sent.
