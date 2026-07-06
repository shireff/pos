# Phase 05 — Inventory & Warehouses Tests

## Unit Tests

### inventory/stock-projection.test.ts

- Stock projection = sum of all applicable events for (warehouse, variant, batch)
- Projection with zero events = 0
- SALE event with delta -5: projection decreases by 5
- RETURN event with delta +3: projection increases by 3
- TRANSFER_OUT and TRANSFER_IN in same transaction: net projection = 0
- Negative stock is allowed transiently but flagged as anomaly
- Stock can never be written directly — only via events (direct write attempt throws)

### inventory/commutativity.property.test.ts (MANDATORY — property-based)

- Given any random valid set of stock events, applying them in every possible order produces the same final projection
- Tested with fast-check generating 50–200 random event orderings per run
- Passes for all event types: SALE, RETURN, TRANSFER_OUT, TRANSFER_IN, ADJUSTMENT, PURCHASE_RECEIPT

### inventory/batch.test.ts

- Batch with expires_at in the past blocks sale (BR-INV-008)
- Sale of expired batch with override permission + approval succeeds
- FEFO: batch with earliest expiry is suggested first
- Batch with serial number cannot be sold twice while active in stock (BR-INV-013)

### inventory/transfer.test.ts

- Transfer lifecycle: requested → approved → shipped → received (happy path)
- Stock leaves source warehouse only at Shipped step
- Stock enters destination warehouse only at Received step
- Discrepancy between shipped and received quantities is captured explicitly (BR-INV-012)
- shipped → cancelled is INVALID (State_Machines.md §5)
- received → any other state is INVALID (terminal)

### inventory/adjustment.test.ts

- Adjustment below threshold: committed immediately
- Adjustment above threshold: enters pending_approval state, does NOT affect projection until approved
- Approved adjustment creates ADJUSTMENT event and updates projection
- Rejected adjustment: no effect on projection

## Integration Tests

### inventory/adjustment-api.integration.test.ts

- POST /v1/stock/adjustments (below threshold): 200, stock updated
- POST /v1/stock/adjustments (above threshold): 202 APPROVAL_REQUIRED
- Caller without inventory.adjust permission: 403 with permissionCode

### inventory/transfer-api.integration.test.ts

- Full transfer lifecycle via API: POST create → approve → ship → receive → projection updated
- GET /v1/stock/movements returns chronological ledger for a product/warehouse

## Sync Tests

- Two SALE events from different devices for same product → both applied (Class A — never conflicts)
- Stock events from Device A replay on Device B in any order → identical projection
- Offline sale event syncs to server and updates server projection correctly

## E2E Tests (Critical Flow #3)

- Create stock transfer on Desktop → approve on Android → ship on Desktop → receive on Android → verify projections on both devices match
- Adjustment with approval: create on Desktop (branch manager) → notification appears on owner's device → approve → stock updated everywhere
