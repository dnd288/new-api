# Decision: Vouchers are a static frontend catalog over the existing Mezon credit rail

## Context

The wallet previously let Mezon users transfer any đồng amount and claim it by hash. The
product now sells six fixed denominations (10k–500k) with pre-generated artwork. The credit
backend (`RequestMezonPay`) already verifies the true transferred amount from the MMN indexer
and credits 1:1, so it is already amount-agnostic.

## Decision

Keep the voucher catalog as a frontend constant (`VOUCHER_DENOMINATIONS`) with bundled SVG
assets, and treat voucher selection as presentation only. No backend table, API, or
validation is added for vouchers.

## Rationale

The denominations are a business constant tied to static artwork files — a database-backed
voucher product would add a table, admin CRUD, and seed data to express what is already
fixed in the bundle. The backend cannot trust a client-declared "voucher amount" anyway; it
must (and does) credit the indexer-reported amount, so server-side voucher state would be
inert.

## Alternatives

### Option A — backend voucher products

Store denominations/images in the DB with admin CRUD.
Pros: denominations changeable without a frontend deploy.
Cons: new table + admin UI + seed for data that is fixed; image bytes still ship with the
bundle; rejected.

### Option B — enforce voucher amounts server-side

Reject claims whose transferred amount is not one of the six values.
Pros: stricter coupling between UI and credit.
Cons: rejects legitimate off-catalog transfers the current product accepts; adds a config
sync between frontend catalog and backend; rejected as unnecessary for 1:1 crediting.

## Consequences

Changing denominations or artwork requires a frontend release. The claim path remains
forgiving (any positive amount credits). No new migration or API surface.

## Reversibility

Cheap: if vouchers later become DB-driven, `VOUCHER_DENOMINATIONS` is replaced by a fetched
list and `VoucherSection` keeps its props; the credit path never changes.

## Status

Accepted (2026-09-09).
