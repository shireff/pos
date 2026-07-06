# Phase 07 — Sales (POS) TODO

## Database

- [ ] Create migration `007_sales_schema.ts`: orders, order_lines, payments, returns, return_lines, shift_sessions collections
- [ ] orders: index (companyId, branchId, status, createdAt), unique index (companyId, clientTxnId)
- [ ] order_lines: index (orderId)
- [ ] payments: index (orderId), index (companyId, createdAt)
- [ ] returns: index (orderId), index (companyId, status, createdAt)
- [ ] shift_sessions: index (companyId, branchId, cashierId, status)
- [ ] JSON Schema: orders requires clientTxnId, branchId, cashierId, status enum(pending/completed/voided), totalAmount positive
- [ ] JSON Schema: payments requires orderId, tenderType enum, amount positive

## Domain — Sales

- [ ] Implement `Order` aggregate: id, companyId, branchId, cashierId, clientTxnId, lines[], payments[], status, totalAmount (Money), taxAmount, discountAmount, createdAt
- [ ] Implement `OrderLine` entity: id, orderId, productId, variantId?, unitId, quantity, unitPrice (Money), discountAmount, taxAmount, batchId?
- [ ] Implement `Payment` entity: id, orderId, tenderType, amount (Money), referenceNumber?, processedAt
- [ ] Implement `Return` aggregate: id, orderId, returnedByUserId, lines[], refundPayments[], status (pending_approval/approved/rejected), approvedByUserId?, reason
- [ ] Implement `ShiftSession` aggregate: id, companyId, branchId, cashierId, openedAt, closedAt?, openingCash (Money), closingCash? (Money), status (open/closed)
- [ ] Implement clientTxnId idempotency check: if order with same clientTxnId exists for company, return existing order instead of creating duplicate
- [ ] Implement split-tender sum validation: sum of payment.amount values must equal order.totalAmount exactly (Money comparison, integer piasters)
- [ ] Implement bundle stock deduction: when OrderLine.productId is a bundle, emit StockMovementRecorded for each bundle component atomically
- [ ] Implement expired batch guard: before completing order, check batchId expiry for each line; reject with BR-INV-008 error
- [ ] Implement return approval threshold: returns where refundTotal > company configuredThreshold require approval; below threshold auto-approve
- [ ] Implement loyalty reversal on return: when return is approved, emit ReverseLoyaltyPointsCommand for original sale amount (BR-SAL-007)
- [ ] Implement void restriction: void only permitted if order was created in current shift session (same shiftSessionId)

## Application — Use Cases

- [ ] `CreateSaleCommand` + handler: validate cart, run discount evaluation (Phase 11), check inventory (Phase 05), run idempotency check, record order + lines + payments atomically, emit OrderCompleted event, trigger loyalty accrual (Phase 08), emit inventory outward events
- [ ] `ProcessReturnCommand` + handler: validate original order exists, create Return in pending_approval or approved state based on threshold
- [ ] `ApproveReturnCommand` + handler: requires sales.refund.approve, transition to approved, trigger inventory inward events, trigger loyalty reversal
- [ ] `VoidSaleCommand` + handler: validate same-session restriction, requires sales.void, transition order to voided, reverse inventory events, reverse loyalty
- [ ] `OpenDrawerSessionCommand` + handler: requires sales.cash_drawer.open_no_sale, emit CashDrawerOpenedNoSale event (audit)
- [ ] `OpenShiftCommand` + handler: requires sales.shift.open_close, create ShiftSession
- [ ] `CloseShiftCommand` + handler: requires sales.shift.open_close, close ShiftSession with closing cash count
- [ ] `GetOrderQuery` + handler: fetch order with lines, payments, return history
- [ ] `GetShiftSummaryQuery` + handler: aggregate sales/returns/payments for shift

## API Endpoints

- [ ] `POST /v1/orders` — body: clientTxnId, lines[], payments[], branchId, discountRuleIds[], couponCode?
- [ ] `GET /v1/orders` — paginated list; filters: branchId, cashierId, dateRange, status
- [ ] `GET /v1/orders/:id` — full order detail
- [ ] `POST /v1/orders/:id/returns` — initiate return
- [ ] `POST /v1/orders/:id/returns/:returnId/approve`
- [ ] `POST /v1/orders/:id/void`
- [ ] `POST /v1/shifts` — open shift
- [ ] `POST /v1/shifts/current/close` — close current shift
- [ ] `GET /v1/shifts/current` — current shift state

## Validation (Zod)

- [ ] `CreateSaleSchema`: clientTxnId string, branchId UUIDv7, lines array min 1 (productId, quantity, unitPrice, batchId?), payments array min 1 (tenderType enum, amount positive integer), discountRuleIds optional array
- [ ] `ProcessReturnSchema`: lines array (orderLineId, returnQuantity positive), reason string min 5, refundPayments array
- [ ] `VoidSaleSchema`: reason string min 5
- [ ] `OpenShiftSchema`: openingCash nonneg integer
- [ ] `CloseShiftSchema`: closingCash nonneg integer

## Permissions

- [ ] Enforce `sales.create` on POST /v1/orders
- [ ] Enforce `sales.view` on GET endpoints
- [ ] Enforce `sales.void` on void endpoint
- [ ] Enforce `sales.return.create` on return endpoint
- [ ] Enforce `sales.refund.approve` on approve-return endpoint
- [ ] Enforce `sales.cash_drawer.open_no_sale` on drawer endpoint
- [ ] Enforce `sales.shift.open_close` on shift open/close endpoints

## Hardware Integration

- [ ] Barcode scan input: POS Register page maintains a hidden input always focused; keypress events from HID wedge fill it; on Enter, trigger product lookup
- [ ] Receipt printer call: after successful sale, call ReceiptPrinter.print() via HAL; on PrinterNotAvailableError, fallback to DigitalReceiptModal
- [ ] Cash drawer pulse: after cash payment tender, call CashDrawer.open() via HAL; failure is logged but does not block sale completion

## Sync

- [ ] orders: Class A — OrderCompleted events are append-only, replayed by eventId, never overwritten
- [ ] returns: Class A — ReturnApproved events append-only
- [ ] shift_sessions: Class B field-level HLC merge

## Desktop UI

- [ ] POS Register page (`apps/desktop/src/features/pos/PosRegisterPage.tsx`): full-screen, barcode input always focused, product search fallback, cart panel (item list with quantity/discount controls), payment panel (tender type selector with split support), shift info header
- [ ] Cart item row: product name, qty stepper, unit price, line discount, line total, remove button
- [ ] Payment panel: tender type buttons, amount input, split payment rows, change display for cash
- [ ] Shift Close dialog: expected cash, actual cash count, summary breakdown

## Android UI

- [ ] Same POS Register screen using shared components
- [ ] Camera barcode scan button via @capacitor-community/barcode-scanner (alternative to HID wedge)
- [ ] Payment panel as bottom-sheet on Android

## E2E Flows

- [ ] E2E Flow #1: scan item → add to cart → tender exact cash → print receipt → verify stock decremented
- [ ] E2E Flow #2: complete sale → initiate return above threshold → approve return → verify inventory restored and loyalty reversed

## Tests

- [ ] See TESTS.md
