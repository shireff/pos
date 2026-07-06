# Phase 07 — Sales (POS) Dependencies

## Incoming

- Phase 01, 02 (Foundation, Auth)
- Phase 03 (Products) — order lines reference product variants
- Phase 04 (Categories & Units) — POS grid uses categories
- Phase 05 (Inventory) — sale creates SALE stock movement events
- Phase 16 (Hardware Integration) — POS requires receipt printer, barcode scanner, cash drawer — Phase 16 should complete before Phase 07 exit gate, or run concurrently with hardware adapters stubbed

## Outgoing

- Phase 08 (Customers) — loyalty accrual triggered by completed sales
- Phase 10 (Payments) — payment tenders are part of the sale flow
- Phase 11 (Discounts & Taxes) — discount/coupon rules applied at sale time
- Phase 12 (Offline Sync) — OrderCompleted is the most critical Class A event in the system
- Phase 13 (Reports) — all sales reports consume order data
- Phase 15 (AI Services) — fraud detection consumes order patterns

## Documents Used

- PRD.md §4.4 (FR-4.1 through FR-4.6)
- API.md §4.2 (sales endpoints)
- Database.md §2.10 (orders, order_lines, payments, returns)
- Hardware.md (receipt printer, scanner, drawer integration)
- Business_Rules.md §2–3 (BR-SAL-001 through BR-SAL-012, BR-RET-001 through BR-RET-004)
- State_Machines.md §2 (Order), §3 (Return)
- Event_Catalog.md §4 (OrderCompleted, OrderVoided, ReturnRequested, etc.)
- UI_UX.md §2.1 (POS Register screen)

## Shared Modules Produced

- `packages/domain/sales` — Order, OrderLine, Payment, Return aggregates
- `packages/application/sales` — CreateSaleCommand, ProcessReturnCommand, VoidSaleCommand
- `packages/ui-components/src/pos/*` — POS Register, Cart, Payment Panel, Receipt screens
- clientTxnId idempotency pattern (reused by all offline-first write commands)
