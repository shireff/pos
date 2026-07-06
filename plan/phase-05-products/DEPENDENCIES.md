# Phase 05 — Inventory & Warehouses Dependencies

## Incoming

- Phase 01 (Foundation)
- Phase 02 (Authentication & Licensing)
- Phase 03 (Products) — stock movements reference product variants
- Phase 04 (Categories & Units) — warehouse assignments reference branches

## Outgoing (blocked until Phase 05 exits)

- Phase 06 (Purchases) — goods receipt creates PURCHASE_RECEIPT stock movement events
- Phase 07 (Sales) — sale creates SALE stock movement events; returns create RETURN events
- Phase 12 (Offline Sync) — inventory is the most critical Class A sync entity; sync engine must understand event-sourced stock before being considered complete
- Phase 13 (Reports) — inventory valuation and stock movement reports read from this phase's data
- Phase 15 (AI Services) — AI inventory predictions consume stock movement history

## Documents Used

- Database.md §2.7–2.9 (stock_items, stock_movement_events, batches, warehouses)
- Architecture.md §6 (event sourcing scope — inventory only)
- Sync_Architecture.md §3.1 (Class A event-sourced entities)
- Business_Rules.md §1 (BR-INV-001 through BR-INV-014)
- State_Machines.md §5 (stock transfer lifecycle)
- Event_Catalog.md §3 (StockMovementRecorded, StockTransfer* events)
- Testing.md §6 (property-based commutativity test — mandatory)

## Shared Modules Produced

- `packages/domain/inventory` — StockItem, StockMovementEvent, Batch, Warehouse, StockTransfer aggregates
- `packages/application/inventory` — all stock use-case handlers
- `packages/infrastructure/mongodb/repositories/stock-movement-event.repository.ts` (append-only)
- `packages/ui-components/src/inventory/*` — Inventory screens
- Stock projection logic shared by Desktop, Android, and Backend
