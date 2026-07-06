# Phase 10 — Payments Dependencies

## Incoming

- Phase 01, 02 (Foundation, Auth)
- Phase 07 (Sales) — payments are recorded as part of the sale flow

## Outgoing

- Phase 13 (Reports) — payment method breakdown in Daily Sales report, Cash Flow report

## Documents Used

- PRD.md §4.7 (FR-7.1 through FR-7.3)
- Database.md §2.10 (payments table — tender_type, amount, provider_reference)
- API.md §4.2 (payments are part of POST /v1/orders)
- Business_Rules.md §3 (BR-SAL-003 — split tender sum must equal grand_total)

## Shared Modules Produced

- `packages/domain/sales/src/value-objects/payment.vo.ts` (extended with all tender types)
- `packages/infrastructure/payments/*` — plugin-based provider adapters
- Payment method breakdown in receipt template
