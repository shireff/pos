# Phase 06 — Purchases Checklist

A phase is **NOT complete** until every item below is checked.

## Database

- [ ] Migration `006_purchases_schema.ts` applies cleanly
- [ ] All indexes in place

## Domain

- [ ] PurchaseOrder aggregate with full state machine implemented
- [ ] Auto-approve rule fires correctly (below threshold → skip pending_approval)
- [ ] GoodsReceipt aggregate with discrepancy capture implemented
- [ ] SupplierInvoice entity implemented
- [ ] OCR stub returns deterministic mock data (consistent output for same input)

## Application

- [ ] All 10 commands implemented with handlers
- [ ] ReceiveGoodsCommand emits StockMovementRecorded events to Phase 05 inventory correctly
- [ ] CancelPurchaseOrderCommand blocked in received states

## API

- [ ] All 11 endpoints tested with permission enforcement
- [ ] OCR stub endpoint accepts file upload and returns structured mock data

## Sync

- [ ] PO header fields in Class B sync
- [ ] Goods receipt events in Class A sync

## Desktop UI

- [ ] PO List with status filter renders correctly
- [ ] PO Create form with line items works
- [ ] Goods Receipt screen with per-line quantity entry works
- [ ] OCR upload shows mock extracted data panel

## Android UI

- [ ] Same screens on Android
- [ ] No Kotlin/Java code

## Tests

- [ ] PO state machine transition tests pass (all valid and invalid transitions)
- [ ] Goods receipt triggers inventory inward events correctly
- [ ] Discrepancy capture test passes

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
