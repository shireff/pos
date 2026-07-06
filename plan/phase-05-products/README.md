# Phase 05 — Inventory & Warehouses

## Purpose

Event-sourced inventory management — stock movements, warehouses, batch/expiry tracking, stock transfers between warehouses, reorder points, and negative-stock prevention. This is the highest-risk domain module in the entire system. All stock quantities are projections of event streams and are NEVER directly written — the stock_items collection is a read-model cache only.

## Scope

- **Database**: stock_items (projection/cache, append-forbidden), stock_movement_events (append-only enforced at repo layer), batches, warehouses, stock_transfers, stock_transfer_lines collections
- **Domain**: StockItem aggregate (read-model projection), StockMovementEvent entity (append-only), Batch entity, Warehouse aggregate, StockTransfer aggregate with full state machine
- **Business Logic**: stock projection (sum of signed quantities from event stream), FEFO (First-Expired First-Out) picking suggestion, negative-stock guard (BR-INV-001), bundle component deduction ratio, batch expiry enforcement (BR-INV-008), reorder point management (manual + AI-suggested stub), serial number tracking
- **Application**: AdjustStockCommand (with approval workflow for large adjustments), TransferStockCommand, ApproveTransferCommand, ShipTransferCommand, ReceiveTransferCommand, CancelTransferCommand, GetStockLevelsQuery, GetStockMovementsQuery
- **API**: POST /v1/stock/adjustments, POST /v1/stock/transfers, POST /v1/stock/transfers/:id/approve, POST /v1/stock/transfers/:id/ship, POST /v1/stock/transfers/:id/receive, POST /v1/stock/transfers/:id/cancel, GET /v1/stock/movements
- **Permissions**: inventory.view, inventory.adjust, inventory.adjust.approve, inventory.batch.manage, inventory.transfer.create, inventory.transfer.approve, inventory.transfer.receive
- **Event Sourcing**: StockMovementRecorded events are commutative — applying them in any order produces identical final stock totals
- **Sync**: Class A — pure event replay, never produces conflicts by construction
- **Desktop UI**: Inventory List (color-coded stock levels: green/amber/red by reorder thresholds), Stock Adjustment Dialog (reason + quantity + batch selection), Stock Transfer Wizard (multi-step: select warehouse pair → add lines → confirm)
- **Android UI**: same screens using shared components
- **Property-Based Test**: apply stock movement events in all possible orderings → assert identical final total every time (commutativity invariant)

## Expected Output

A working inventory system where:

- All stock quantities are read from event stream projections — never raw writes to stock totals
- Negative stock is prevented by domain guard before any event is recorded
- Stock adjustments requiring approval are blocked at Application layer until approved
- Stock transfers follow the full state machine (draft → pending_approval → approved → shipped → received / cancelled)
- The property-based commutativity test passes across arbitrary event orderings
- FEFO batch suggestion returns correct expiry-ordered batches

## Documents Referenced

- Database.md §2.7–2.9
- Architecture.md §6
- Sync Architecture.md §3.1
- Business_Rules.md §1
- State_Machines.md §5
- Event_Catalog.md §3

## Included Modules

- `packages/domain/inventory` — full event-sourced implementation
- `packages/application/inventory` — all command and query handlers
- `packages/infrastructure/mongodb/migrations/005_inventory_schema.ts`
- `packages/infrastructure/mongodb/repositories/stock-movement-event.repository.ts`
- `packages/infrastructure/mongodb/repositories/stock-item.repository.ts`
- `packages/infrastructure/mongodb/repositories/warehouse.repository.ts`
- `packages/infrastructure/mongodb/repositories/stock-transfer.repository.ts`
- `apps/backend/src/http/inventory/*`
- `packages/ui-components/src/inventory/*`
- `apps/desktop/src/features/inventory/*`
- `apps/android/src/features/inventory/*`
