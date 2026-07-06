# Phase 09 — Suppliers Dependencies

## Incoming

- Phase 01, 02 (Foundation, Auth)
- Phase 06 (Purchases) — PO history needed for supplier performance metrics

## Outgoing

- Phase 13 (Reports) — Supplier Performance report
- Phase 15 (AI Services) — AI supplier suggestion uses performance history

## Documents Used

- Database.md §2.12 (suppliers, supplier ledger)
- Reports.md §2.10 (Supplier Performance)
- Business_Rules.md §7 (BR-SUP-001 through BR-SUP-005)
- AI.md §3 (supplier performance LLM narrative only — not the score)

## Shared Modules Produced

- `packages/domain/purchasing/src/aggregates/supplier.aggregate.ts`
- `packages/infrastructure/mongodb/repositories/supplier.repository.ts`
- `packages/ui-components/src/suppliers/*` — Supplier List, Ledger screens
