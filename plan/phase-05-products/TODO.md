# Phase 05 — Inventory & Warehouses TODO

## Database

- [ ] Create migration `005_inventory_schema.ts`: stock_items (projection cache, no direct writes via repository), stock_movement_events (append-only, repository blocks UPDATE/DELETE), batches, warehouses, stock_transfers, stock_transfer_lines collections
- [ ] stock_movement_events: compound index (companyId, productId, warehouseId) for efficient projection replay
- [ ] stock_items: unique index (companyId, productId, variantId, warehouseId) for cache lookup
- [ ] warehouses: index (companyId) with isActive filter
- [ ] stock_transfers: index (companyId, status, createdAt)
- [ ] JSON Schema: stock_movement_events requires eventType enum(inward/outward/adjustment/transfer_out/transfer_in/initial), quantity integer (signed), productId, warehouseId, referenceType, referenceId
- [ ] Enforce append-only on stock_movement_events at repository layer (throw if UPDATE or DELETE is attempted)
- [ ] Enforce no direct writes to stock_items quantity fields at repository layer (quantity is only written by projection worker)

## Domain — Inventory

- [ ] Implement `Warehouse` aggregate: id, companyId, name, address, isDefault, isActive, managerId
- [ ] Implement `StockMovementEvent` entity: id (UUIDv7), companyId, productId, variantId (nullable), warehouseId, batchId (nullable), eventType, quantity (signed integer), referenceType, referenceId, occurredAt, hlcTimestamp
- [ ] Implement `StockItem` aggregate (read-model projection): id, companyId, productId, variantId, warehouseId, quantityOnHand (projection sum), reservedQuantity, reorderPoint, reorderQuantity
- [ ] Implement `Batch` entity: id, productId, batchNumber, expiryDate, manufacturingDate, costPrice, quantityRemaining
- [ ] Implement `StockTransfer` aggregate with state machine: draft → pending_approval → approved → shipped → received / cancelled
- [ ] Implement negative-stock guard domain service: before recording an outward event, verify quantityOnHand - quantity >= 0; reject with NegativeStockError if not
- [ ] Implement FEFO suggestion domain service: given productId and warehouseId, return batches sorted by expiryDate ascending (earliest expiry first)
- [ ] Implement batch expiry enforcement: reject any outward movement if referenced batch is past expiry (BR-INV-008)
- [ ] Implement bundle component deduction: when a bundle product is sold, emit individual outward events for each component proportional to deductionRatio
- [ ] Implement reorder point check: after every outward event, if quantityOnHand <= reorderPoint emit ReorderPointReached domain event

## Application — Use Cases

- [ ] `AdjustStockCommand` + handler: validate product/warehouse exist, check approval threshold (auto-approve if below limit, else emit AdjustmentRequiresApproval and block), record StockMovementEvent of type adjustment, project into stock_items
- [ ] `ApproveAdjustmentCommand` + handler: requires inventory.adjust.approve permission, unblocks adjustment, records event
- [ ] `TransferStockCommand` + handler: creates StockTransfer in draft state with lines
- [ ] `SubmitTransferForApprovalCommand` + handler: transitions draft → pending_approval, fires approval notification
- [ ] `ApproveTransferCommand` + handler: requires inventory.transfer.approve, transitions to approved
- [ ] `ShipTransferCommand` + handler: requires inventory.transfer.create, transitions to shipped, records transfer_out events
- [ ] `ReceiveTransferCommand` + handler: requires inventory.transfer.receive, transitions to received, records transfer_in events, handles partial receipts
- [ ] `CancelTransferCommand` + handler: valid only in draft/pending_approval states
- [ ] `GetStockLevelsQuery` + handler: reads from stock_items projection cache, filters by warehouse/product/below-reorder
- [ ] `GetStockMovementsQuery` + handler: paginated read from stock_movement_events by product/warehouse/date range

## API Endpoints

- [ ] `POST /v1/stock/adjustments` — body: productId, variantId?, warehouseId, quantity (signed), reason, batchId?
- [ ] `POST /v1/stock/adjustments/:id/approve` — approve pending adjustment
- [ ] `POST /v1/stock/transfers` — create transfer (source/destination warehouse, lines)
- [ ] `POST /v1/stock/transfers/:id/submit` — submit draft for approval
- [ ] `POST /v1/stock/transfers/:id/approve`
- [ ] `POST /v1/stock/transfers/:id/ship`
- [ ] `POST /v1/stock/transfers/:id/receive` — body: received lines with quantities (supports partial)
- [ ] `POST /v1/stock/transfers/:id/cancel`
- [ ] `GET /v1/stock/levels` — current stock by product/warehouse with reorder indicators
- [ ] `GET /v1/stock/movements` — paginated event history
- [ ] `GET /v1/warehouses` — list active warehouses
- [ ] `POST /v1/warehouses` — create warehouse
- [ ] `PATCH /v1/warehouses/:id` — update warehouse

## Validation (Zod)

- [ ] `AdjustStockSchema`: productId UUIDv7, warehouseId UUIDv7, quantity nonzero integer, reason string min 5, batchId optional
- [ ] `CreateTransferSchema`: sourceWarehouseId, destinationWarehouseId (must differ), lines array min 1, each with productId, variantId?, quantity positive integer, batchId?
- [ ] `ReceiveTransferSchema`: lines array, each with transferLineId, receivedQuantity positive integer

## Permissions

- [ ] Enforce `inventory.view` on all GET endpoints
- [ ] Enforce `inventory.adjust` on POST /v1/stock/adjustments
- [ ] Enforce `inventory.adjust.approve` on approve endpoint
- [ ] Enforce `inventory.batch.manage` on all batch-related operations
- [ ] Enforce `inventory.transfer.create` on transfer create and ship
- [ ] Enforce `inventory.transfer.approve` on approve endpoint
- [ ] Enforce `inventory.transfer.receive` on receive endpoint

## Event Sourcing

- [ ] StockMovementRecorded domain event emitted for every stock change
- [ ] Projection worker: subscribes to StockMovementRecorded, updates stock_items.quantityOnHand atomically
- [ ] Replay command: can replay all events for a product/warehouse to recompute stock_items from scratch (used for integrity checks)
- [ ] Commutativity invariant: quantityOnHand = sum(signed quantities) regardless of processing order

## Sync

- [ ] stock_movement_events: Class A — replayed in arrival order, never conflicts
- [ ] warehouses: Class B field-level HLC merge
- [ ] stock_transfers: Class A for line receipt events, Class B for header fields

## Desktop UI

- [ ] Inventory List page (`apps/desktop/src/features/inventory/InventoryListPage.tsx`): table with product name, SKU, warehouse, qty on hand (green/amber/red vs reorder point), batch count; filter by warehouse/category/below-reorder
- [ ] Stock Adjustment Dialog: product search, warehouse selector, batch selector (FEFO order), quantity input, reason field, submit (with approval badge if threshold applies)
- [ ] Stock Transfer Wizard: step 1 — select source/destination warehouses; step 2 — add product lines; step 3 — confirm and submit
- [ ] Transfer Detail page: timeline showing state transitions, lines with shipped/received quantities

## Android UI

- [ ] Same Inventory List, Adjustment Dialog, Transfer Wizard using shared components
- [ ] Adjustment dialog as bottom-sheet on Android

## Property-Based Test

- [ ] `stock-commutativity.property.test.ts`: generate random sequences of stock movement events (inward/outward/adjustment) for a product; apply in all possible orderings (fast-check permutations); assert final quantityOnHand is identical across all orderings

## Tests

- [ ] See TESTS.md
