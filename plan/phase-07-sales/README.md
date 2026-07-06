# Phase 07 — Sales (POS)

## Purpose

The core revenue-generating module — POS cashier screen, cart management, split payments, cash drawer sessions, returns with approval workflow, receipt printing with digital fallback. This is the highest-traffic code path in the entire system and must complete a sale in under 300ms on low-end hardware even when fully offline.

## Scope

- **Database**: orders, order_lines, payments, returns collections with append-only enforcement for completed orders
- **Domain**: Order aggregate, OrderLine entity, Payment entity, Return aggregate with state machine
- **Business Logic**: clientTxnId idempotency (duplicate submission returns original order), split-tender sum validation (sum of payment amounts must equal grand_total), bundle stock deduction in the same atomic transaction as order creation, expired batch rejection (BR-INV-008 enforced at sale time), return approval threshold (auto-approve below limit, require approval above), loyalty point reversal on approved return (BR-SAL-007), void restricted to same-session only
- **Application**: CreateSaleCommand, ProcessReturnCommand, ApproveReturnCommand, VoidSaleCommand, OpenDrawerSessionCommand, CloseShiftCommand, GetOrderQuery, GetShiftSummaryQuery
- **API**: POST /v1/orders, POST /v1/orders/:id/returns, POST /v1/orders/:id/returns/:returnId/approve, POST /v1/orders/:id/void, GET /v1/orders, GET /v1/shifts/current
- **Permissions**: sales.create, sales.view, sales.discount.apply, sales.discount.approve, sales.void, sales.refund.approve, sales.return.create, sales.cash_drawer.open_no_sale, sales.shift.open_close
- **Hardware Integration**: barcode scan input handling (HID wedge — barcode field always focused), receipt printer call with digital fallback if printer unavailable, cash drawer open pulse via hardware abstraction layer
- **Sync**: Class A — OrderCompleted and ReturnApproved events are append-only, replayed in order, never overwritten
- **Desktop UI**: POS Register screen (barcode input always focused, cart panel with quantity/discount controls, payment panel with split tender support, shift summary drawer), Shift Close Summary dialog
- **Android UI**: same POS screen with camera barcode scan option via @capacitor-community/barcode-scanner as alternative to HID input
- **E2E Flow #1**: complete offline cash sale — scan item → add to cart → tender cash → print receipt → verify inventory decremented
- **E2E Flow #2**: return with approval — initiate return → above-threshold triggers approval request → approver approves → inventory incremented → loyalty points reversed

## Expected Output

A working POS system where:

- Sales complete in under 300ms on the low-end hardware profile
- clientTxnId prevents duplicate orders on network retry
- Split payments sum validation rejects mismatched totals
- Bundle components are deducted atomically with the parent order
- Returns follow the approval workflow with loyalty reversal
- E2E flows #1 and #2 both pass in CI

## Documents Referenced

- PRD.md §4.4
- API.md §4.2
- Database.md §2.10
- Hardware.md
- Business_Rules.md §2–3
- State_Machines.md §2–3
- UI_UX.md §2.1

## Included Modules

- `packages/domain/sales` — full implementation
- `packages/application/sales` — all command and query handlers
- `packages/infrastructure/mongodb/migrations/007_sales_schema.ts`
- `packages/infrastructure/mongodb/repositories/order.repository.ts`
- `packages/infrastructure/mongodb/repositories/payment.repository.ts`
- `apps/backend/src/http/sales/*`
- `packages/ui-components/src/pos/*`
- `apps/desktop/src/features/pos/*`
- `apps/android/src/features/pos/*`
