# Phase 07 — Sales (POS) Tests

## Unit Tests

### sales/create-sale.test.ts

- Sale with sufficient stock: completes, SALE stock event emitted per line
- Sale with insufficient stock: blocked with STOCK_INSUFFICIENT (never oversells silently)
- Bundle sale with all components sufficient: completes, all component stock events emitted
- Bundle sale with one component insufficient: blocked with STOCK_INSUFFICIENT + identifies which component
- Sale with expired batch: blocked with BUSINESS_RULE_VIOLATION
- Split tender sum ≠ grand_total: blocked with VALIDATION_ERROR (BR-SAL-003)
- clientTxnId replay: second POST with same clientTxnId returns original order (idempotent, no duplicate)
- Cash drawer opens on cash-tender sale completion
- Cash drawer failure does NOT block sale completion (manual open prompt shown)

### sales/return.test.ts

- Return below threshold: auto-approved, stock RETURN event emitted
- Return above threshold: enters pending_approval, stock NOT affected until approved (BR-RET-002)
- Rejected return: zero stock or loyalty effect (BR-RET-003)
- Approved return: stock RETURN event emitted, loyalty points reversed proportionally (BR-SAL-007)
- Return without original order reference: blocked (BR-RET-001)

### sales/void.test.ts

- Void within same session/shift: succeeds, stock reversed
- Void outside session/shift (when policy prohibits): blocked with BUSINESS_RULE_VIOLATION
- VoidSaleCommand always logged with reason in audit_entries

## Integration Tests

### sales/sale-api.integration.test.ts

- POST /v1/orders offline then sync: order appears on server after sync
- Two concurrent offline orders for same product: both SALE events applied; projection reflects both
- POST /v1/orders with trial_expired subscription: 403 TRIAL_EXPIRED
- Caller without sales.create permission: 403 with permissionCode: "sales.create"

### sales/receipt.integration.test.ts

- Receipt printed successfully → PrintResult.success
- Printer unavailable → sale still completes + digital receipt returned
- Digital receipt contains all required fields (order id, items, totals, tax, company info)

## E2E Tests (Critical Flows #1 and #2 — MANDATORY exit gate)

### e2e/flow-1-cash-sale.e2e.test.ts (Critical Flow #1)

- Cashier scans barcode → product added to cart → cash payment → sale completes offline
- Receipt prints (or digital fallback shown if no printer)
- Stock decremented in local projection
- Sale syncs to server when connectivity restored
- Sale appears in daily sales report

### e2e/flow-2-return.e2e.test.ts (Critical Flow #2)

- Manager opens completed sale → initiates return → return above threshold → enters pending_approval
- Owner approves on their device → stock restored → loyalty points reversed
- Return below threshold → auto-approved immediately

## Offline Tests

- App network fully disabled → complete a sale → sale recorded locally → reconnect → sale syncs
- App crashes after local commit but before outbox send → restart → sale still in outbox → syncs on reconnect
