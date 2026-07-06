# Phase 05 — Inventory & Warehouses Checklist

A phase is **NOT complete** until every item below is checked.

## Database

- [ ] Migration `005_inventory_schema.ts` applies cleanly
- [ ] stock_movement_events repository BLOCKS UPDATE and DELETE (throws if attempted) — verified by contract test
- [ ] stock_items quantity fields cannot be directly written (only via projection worker) — verified by contract test

## Domain

- [ ] StockItem aggregate as read-model projection implemented
- [ ] StockMovementEvent as append-only entity implemented
- [ ] Batch entity with expiry tracking implemented
- [ ] Warehouse aggregate implemented
- [ ] StockTransfer aggregate with full state machine implemented
- [ ] Negative-stock guard rejects outward events that would go below zero
- [ ] FEFO suggestion returns batches sorted by expiry date ascending
- [ ] Batch expiry enforcement (BR-INV-008) rejects sales of expired batches

## Application

- [ ] All 9 commands and 2 queries implemented with handlers
- [ ] AdjustStockCommand approval workflow: auto-approve below threshold, block above threshold until approved
- [ ] StockTransfer full state machine tested (all transitions and invalid transitions)

## Event Sourcing

- [ ] Projection worker rebuilds stock_items from event replay correctly
- [ ] Replay command reproduces exact stock totals from scratch

## **Property-Based Test — MANDATORY EXIT GATE**

- [ ] `stock-commutativity.property.test.ts` PASSES: applying stock events in all possible orderings produces identical final total

## API

- [ ] All 9 API endpoints implemented with Zod validation
- [ ] Permission enforcement tested for all 7 permission codes

## Sync

- [ ] stock_movement_events classified as Class A (no conflict possible)
- [ ] Warehouses synced as Class B

## Desktop UI

- [ ] Inventory List with color-coded stock levels renders correctly
- [ ] Stock Adjustment Dialog with approval badge renders
- [ ] Stock Transfer Wizard 3-step flow works

## Android UI

- [ ] Same screens on Android using shared components
- [ ] No Kotlin/Java code in Android inventory implementation

## Tests

- [ ] Property-based commutativity test passes (mandatory)
- [ ] FEFO batch ordering test passes
- [ ] Negative-stock guard test passes
- [ ] All integration tests pass

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
