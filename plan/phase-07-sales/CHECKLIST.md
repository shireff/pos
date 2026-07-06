# Phase 07 — Sales (POS) Checklist

A phase is **NOT complete** until every item below is checked.

## Database

- [ ] Migration `007_sales_schema.ts` applies cleanly
- [ ] Unique index on (companyId, clientTxnId) enforced — prevents duplicate orders

## Domain

- [ ] Order aggregate, OrderLine, Payment, Return, ShiftSession all implemented
- [ ] clientTxnId idempotency returns existing order on duplicate submission
- [ ] Split-tender sum validation rejects mismatched totals (integer piaster comparison)
- [ ] Bundle stock deduction fires correct component events atomically
- [ ] Expired batch guard (BR-INV-008) rejects sale lines with expired batch
- [ ] Return approval threshold: auto-approve below limit, block above until approved
- [ ] Loyalty point reversal on return (BR-SAL-007): fires ReverseLoyaltyPointsCommand after approval
- [ ] Void restriction: void only allowed for orders in current shift session

## Application

- [ ] All 8 commands and 2 queries implemented with handlers
- [ ] CreateSaleCommand completes under 300ms on benchmark test

## API

- [ ] POST /v1/orders handles all sale creation scenarios including bundle deduction and split payment
- [ ] Return and approval endpoints tested for permission enforcement
- [ ] All Zod schemas validate request bodies

## Hardware Integration

- [ ] Barcode input field always focused on POS Register page
- [ ] Receipt printer call triggers DigitalReceiptModal on PrinterNotAvailableError
- [ ] Cash drawer pulse failure does not block sale completion

## Sync

- [ ] orders and returns classified as Class A (append-only events)

## Desktop UI

- [ ] POS Register page: barcode input always focused, cart panel, payment panel all functional
- [ ] Shift Close dialog shows full summary

## Android UI

- [ ] Camera barcode scan option via @capacitor-community/barcode-scanner works
- [ ] Payment panel as bottom-sheet works

## **E2E Flows — MANDATORY EXIT GATES**

- [ ] E2E Flow #1 PASSES: offline cash sale → inventory decremented → receipt issued
- [ ] E2E Flow #2 PASSES: return with approval → inventory restored → loyalty points reversed

## Tests

- [ ] clientTxnId idempotency test passes
- [ ] Split tender validation tests pass
- [ ] Bundle deduction atomicity test passes
- [ ] Return approval workflow test passes

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
- [ ] POS sale creation <300ms on benchmark hardware profile
