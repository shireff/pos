# Phase 07 — Sales (POS) TODO
> ?? **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
> - **ALL UI text MUST use useT() / 	() with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use pps/backend/src/lib/errors.ts with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.

## Database

- [x] Create migration `007_sales_schema.ts`: orders, order_lines, payments, returns, return_lines, shift_sessions collections
- [x] orders: index (companyId, branchId, status, createdAt), unique index (companyId, clientTxnId)
- [x] order_lines: index (orderId)
- [x] payments: index (orderId), index (companyId, createdAt)
- [x] returns: index (orderId), index (companyId, status, createdAt)
- [x] shift_sessions: index (companyId, branchId, cashierId, status)
- [x] JSON Schema: orders requires clientTxnId, branchId, cashierId, status enum(pending/completed/voided), totalAmount positive
- [x] JSON Schema: payments requires orderId, tenderType enum, amount positive

## Domain — Sales

- [x] Implement `Order` aggregate: id, companyId, branchId, cashierId, clientTxnId, lines[], payments[], status, totalAmount (Money), taxAmount, discountAmount, createdAt
- [x] Implement `OrderLine` entity: id, orderId, productId, variantId?, unitId, quantity, unitPrice (Money), discountAmount, taxAmount, batchId?
- [x] Implement `Payment` entity: id, orderId, tenderType, amount (Money), referenceNumber?, processedAt
- [x] Implement `Return` aggregate: id, orderId, returnedByUserId, lines[], refundPayments[], status (pending_approval/approved/rejected), approvedByUserId?, reason
- [x] Implement `ShiftSession` aggregate: id, companyId, branchId, cashierId, openedAt, closedAt?, openingCash (Money), closingCash? (Money), status (open/closed)
- [x] Implement clientTxnId idempotency check: if order with same clientTxnId exists for company, return existing order instead of creating duplicate
- [x] Implement split-tender sum validation: sum of payment.amount values must equal order.totalAmount exactly (Money comparison, integer piasters)
- [x] Implement bundle stock deduction: when OrderLine.productId is a bundle, emit StockMovementRecorded for each bundle component atomically
- [x] Implement expired batch guard: before completing order, check batchId expiry for each line; reject with BR-INV-008 error
- [x] Implement return approval threshold: returns where refundTotal > company configuredThreshold require approval; below threshold auto-approve
- [x] Implement loyalty reversal on return: when return is approved, emit ReverseLoyaltyPointsCommand for original sale amount (BR-SAL-007)
- [x] Implement void restriction: void only permitted if order was created in current shift session (same shiftSessionId)

## Application — Use Cases

- [x] `CreateSaleCommand` + handler: validate cart, run discount evaluation (Phase 11), check inventory (Phase 05), run idempotency check, record order + lines + payments atomically, emit OrderCompleted event, trigger loyalty accrual (Phase 08), emit inventory outward events
- [x] `ProcessReturnCommand` + handler: validate original order exists, create Return in pending_approval or approved state based on threshold
- [x] `ApproveReturnCommand` + handler: requires sales.refund.approve, transition to approved, trigger inventory inward events, trigger loyalty reversal
- [x] `VoidSaleCommand` + handler: validate same-session restriction, requires sales.void, transition order to voided, reverse inventory events, reverse loyalty
- [x] `OpenDrawerSessionCommand` + handler: requires sales.cash_drawer.open_no_sale, emit CashDrawerOpenedNoSale event (audit)
- [x] `OpenShiftCommand` + handler: requires sales.shift.open_close, create ShiftSession
- [x] `CloseShiftCommand` + handler: requires sales.shift.open_close, close ShiftSession with closing cash count
- [x] `GetOrderQuery` + handler: fetch order with lines, payments, return history
- [x] `GetShiftSummaryQuery` + handler: aggregate sales/returns/payments for shift

## API Endpoints

- [x] `POST /v1/orders` — body: clientTxnId, lines[], payments[], branchId, discountRuleIds[], couponCode?
- [x] `GET /v1/orders` — paginated list; filters: branchId, cashierId, dateRange, status
- [x] `GET /v1/orders/:id` — full order detail
- [x] `POST /v1/orders/:id/returns` — initiate return
- [x] `POST /v1/orders/:id/returns/:returnId/approve`
- [x] `POST /v1/orders/:id/void`
- [x] `POST /v1/shifts` — open shift
- [x] `POST /v1/shifts/current/close` — close current shift
- [x] `GET /v1/shifts/current` — current shift state

## Validation (Zod)

- [x] `CreateSaleSchema`: clientTxnId string, branchId UUIDv7, lines array min 1 (productId, quantity, unitPrice, batchId?), payments array min 1 (tenderType enum, amount positive integer), discountRuleIds optional array
- [x] `ProcessReturnSchema`: lines array (orderLineId, returnQuantity positive), reason string min 5, refundPayments array
- [x] `VoidSaleSchema`: reason string min 5
- [x] `OpenShiftSchema`: openingCash nonneg integer
- [x] `CloseShiftSchema`: closingCash nonneg integer

## Permissions

- [x] Enforce `sales.create` on POST /v1/orders
- [x] Enforce `sales.view` on GET endpoints
- [x] Enforce `sales.void` on void endpoint
- [x] Enforce `sales.return.create` on return endpoint
- [x] Enforce `sales.refund.approve` on approve-return endpoint
- [x] Enforce `sales.cash_drawer.open_no_sale` on drawer endpoint
- [x] Enforce `sales.shift.open_close` on shift open/close endpoints

## Hardware Integration

- [x] Barcode scan input: POS Register page maintains a hidden input always focused; keypress events from HID wedge fill it; on Enter, trigger product lookup
- [x] Receipt printer call: after successful sale, call ReceiptPrinter.print() via HAL; on PrinterNotAvailableError, fallback to DigitalReceiptModal
- [x] Cash drawer pulse: after cash payment tender, call CashDrawer.open() via HAL; failure is logged but does not block sale completion

## Sync

- [x] orders: Class A — OrderCompleted events are append-only, replayed by eventId, never overwritten
- [x] returns: Class A — ReturnApproved events append-only
- [x] shift_sessions: Class B field-level HLC merge

## Desktop UI

- [x] POS Register page (`apps/desktop/src/features/pos/PosRegisterPage.tsx`): full-screen, barcode input always focused, product search fallback, cart panel (item list with quantity/discount controls), payment panel (tender type selector with split support), shift info header
- [x] Cart item row: product name, qty stepper, unit price, line discount, line total, remove button
- [x] Payment panel: tender type buttons, amount input, split payment rows, change display for cash
- [x] Shift Close dialog: expected cash, actual cash count, summary breakdown

## Android UI

- [x] Same POS Register screen using shared components
- [x] Camera barcode scan button via @capacitor-community/barcode-scanner (alternative to HID wedge)
- [x] Payment panel as bottom-sheet on Android

## E2E Flows

- [x] E2E Flow #1: scan item → add to cart → tender exact cash → print receipt → verify stock decremented
- [x] E2E Flow #2: complete sale → initiate return above threshold → approve return → verify inventory restored and loyalty reversed

## Tests

- [x] See TESTS.md

### Quality Gates

- [x] Zero TypeScript errors
- [x] All tests passing
- [x] Update API.md if any endpoint contract was refined during implementation
