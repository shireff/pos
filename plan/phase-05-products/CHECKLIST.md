# Phase 05 Ã¢â‚¬â€ Inventory & Warehouses Checklist

A phase is **NOT complete** until every item below is checked.

## Database

- [x] Migration `005_inventory_schema.ts` applies cleanly
- [x] stock_movement_events repository BLOCKS UPDATE and DELETE (throws if attempted) Ã¢â‚¬â€ verified by contract test
- [x] stock_items quantity fields cannot be directly written (only via projection worker) Ã¢â‚¬â€ verified by contract test

## Domain

- [x] StockItem aggregate as read-model projection implemented
- [x] StockMovementEvent as append-only entity implemented
- [x] Batch entity with expiry tracking implemented
- [x] Warehouse aggregate implemented
- [x] StockTransfer aggregate with full state machine implemented
- [x] Negative-stock guard rejects outward events that would go below zero
- [x] FEFO suggestion returns batches sorted by expiry date ascending
- [x] Batch expiry enforcement (BR-INV-008) rejects sales of expired batches

## Application

- [x] All 9 commands and 2 queries implemented with handlers
- [x] AdjustStockCommand approval workflow: auto-approve below threshold, block above threshold until approved
- [x] StockTransfer full state machine tested (all transitions and invalid transitions)

## Event Sourcing

- [x] Projection worker rebuilds stock_items from event replay correctly
- [x] Replay command reproduces exact stock totals from scratch

## **Property-Based Test Ã¢â‚¬â€ MANDATORY EXIT GATE**

- [x] `stock-commutativity.property.test.ts` PASSES: applying stock events in all possible orderings produces identical final total

## API

- [x] All 9 API endpoints implemented with Zod validation
- [x] Permission enforcement tested for all 7 permission codes

## Sync

- [x] stock_movement_events classified as Class A (no conflict possible)
- [x] Warehouses synced as Class B

## Desktop UI

- [x] Inventory List with color-coded stock levels renders correctly
- [x] Stock Adjustment Dialog with approval badge renders
- [x] Stock Transfer Wizard 3-step flow works

## Android UI

- [x] Same screens on Android using shared components
- [x] No Kotlin/Java code in Android inventory implementation

## Tests

- [x] Property-based commutativity test passes (mandatory)
- [x] FEFO batch ordering test passes
- [x] Negative-stock guard test passes
- [ ] All integration tests pass

## Quality Gates

- [x] Zero TypeScript errors
- [x] Zero ESLint errors
- [ ] All tests passing in CI
