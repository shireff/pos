# Phase 05 Ã¢â‚¬â€ Inventory & Warehouses TODO
> ?? **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
> - **ALL UI text MUST use useT() / 	() with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use pps/backend/src/lib/errors.ts with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.
> - **ALL UI styling MUST use the `@packages/ui-components` design system — NO inline styles (`style={{...}}`) are allowed anywhere.** Do not hardcode styling; always use the shared design-system components and design tokens.

## Database

- [x] Create migration `005_inventory_schema.ts`: stock_items (projection cache, no direct writes via repository), stock_movement_events (append-only, repository blocks UPDATE/DELETE), batches, warehouses, stock_transfers, stock_transfer_lines collections
- [x] stock_movement_events: compound index (companyId, productId, warehouseId) for efficient projection replay
- [x] stock_items: unique index (companyId, productId, variantId, warehouseId) for cache lookup
- [x] warehouses: index (companyId) with isActive filter
- [x] stock_transfers: index (companyId, status, createdAt)
- [x] JSON Schema: stock_movement_events requires eventType enum(inward/outward/adjustment/transfer_out/transfer_in/initial), quantity integer (signed), productId, warehouseId, referenceType, referenceId
- [x] Enforce append-only on stock_movement_events at repository layer (throw if UPDATE or DELETE is attempted)
- [x] Enforce no direct writes to stock_items quantity fields at repository layer (quantity is only written by projection worker)

## Domain Ã¢â‚¬â€ Inventory

- [x] Implement `Warehouse` aggregate: id, companyId, name, address, isDefault, isActive, managerId
- [x] Implement `StockMovementEvent` entity: id (UUIDv7), companyId, productId, variantId (nullable), warehouseId, batchId (nullable), eventType, quantity (signed integer), referenceType, referenceId, occurredAt, hlcTimestamp
- [x] Implement `StockItem` aggregate (read-model projection): id, companyId, productId, variantId, warehouseId, quantityOnHand (projection sum), reservedQuantity, reorderPoint, reorderQuantity
- [x] Implement `Batch` entity: id, productId, batchNumber, expiryDate, manufacturingDate, costPrice, quantityRemaining
- [x] Implement `StockTransfer` aggregate with state machine: draft Ã¢â€ â€™ pending_approval Ã¢â€ â€™ approved Ã¢â€ â€™ shipped Ã¢â€ â€™ received / cancelled
- [x] Implement negative-stock guard domain service: before recording an outward event, verify quantityOnHand - quantity >= 0; reject with NegativeStockError if not
- [x] Implement FEFO suggestion domain service: given productId and warehouseId, return batches sorted by expiryDate ascending (earliest expiry first)
- [x] Implement batch expiry enforcement: reject any outward movement if referenced batch is past expiry (BR-INV-008)
- [x] Implement bundle component deduction: when a bundle product is sold, emit individual outward events for each component proportional to deductionRatio
- [x] Implement reorder point check: after every outward event, if quantityOnHand <= reorderPoint emit ReorderPointReached domain event

## Application Ã¢â‚¬â€ Use Cases

- [x] `AdjustStockCommand` + handler: validate product/warehouse exist, check approval threshold (auto-approve if below limit, else emit AdjustmentRequiresApproval and block), record StockMovementEvent of type adjustment, project into stock_items
- [x] `ApproveAdjustmentCommand` + handler: requires inventory.adjust.approve permission, unblocks adjustment, records event
- [x] `TransferStockCommand` + handler: creates StockTransfer in draft state with lines
- [x] `SubmitTransferForApprovalCommand` + handler: transitions draft Ã¢â€ â€™ pending_approval, fires approval notification
- [x] `ApproveTransferCommand` + handler: requires inventory.transfer.approve, transitions to approved
- [x] `ShipTransferCommand` + handler: requires inventory.transfer.create, transitions to shipped, records transfer_out events
- [x] `ReceiveTransferCommand` + handler: requires inventory.transfer.receive, transitions to received, records transfer_in events, handles partial receipts
- [x] `CancelTransferCommand` + handler: valid only in draft/pending_approval states
- [x] `GetStockLevelsQuery` + handler: reads from stock_items projection cache, filters by warehouse/product/below-reorder
- [x] `GetStockMovementsQuery` + handler: paginated read from stock_movement_events by product/warehouse/date range

## API Endpoints

- [x] `POST /v1/stock/adjustments` Ã¢â‚¬â€ body: productId, variantId?, warehouseId, quantity (signed), reason, batchId?
- [x] `POST /v1/stock/adjustments/:id/approve` Ã¢â‚¬â€ approve pending adjustment
- [x] `POST /v1/stock/transfers` Ã¢â‚¬â€ create transfer (source/destination warehouse, lines)
- [x] `POST /v1/stock/transfers/:id/submit` Ã¢â‚¬â€ submit draft for approval
- [x] `POST /v1/stock/transfers/:id/approve`
- [x] `POST /v1/stock/transfers/:id/ship`
- [x] `POST /v1/stock/transfers/:id/receive` Ã¢â‚¬â€ body: received lines with quantities (supports partial)
- [x] `POST /v1/stock/transfers/:id/cancel`
- [x] `GET /v1/stock/levels` Ã¢â‚¬â€ current stock by product/warehouse with reorder indicators
- [x] `GET /v1/stock/movements` Ã¢â‚¬â€ paginated event history
- [x] `GET /v1/warehouses` Ã¢â‚¬â€ list active warehouses
- [x] `POST /v1/warehouses` Ã¢â‚¬â€ create warehouse
- [x] `PATCH /v1/warehouses/:id` Ã¢â‚¬â€ update warehouse

## Validation (Zod)

- [x] `AdjustStockSchema`: productId UUIDv7, warehouseId UUIDv7, quantity nonzero integer, reason string min 5, batchId optional
- [x] `CreateTransferSchema`: sourceWarehouseId, destinationWarehouseId (must differ), lines array min 1, each with productId, variantId?, quantity positive integer, batchId?
- [x] `ReceiveTransferSchema`: lines array, each with transferLineId, receivedQuantity positive integer

## Permissions

- [x] Enforce `inventory.view` on all GET endpoints
- [x] Enforce `inventory.adjust` on POST /v1/stock/adjustments
- [x] Enforce `inventory.adjust.approve` on approve endpoint
- [x] Enforce `inventory.batch.manage` on all batch-related operations
- [x] Enforce `inventory.transfer.create` on transfer create and ship
- [x] Enforce `inventory.transfer.approve` on approve endpoint
- [x] Enforce `inventory.transfer.receive` on receive endpoint

## Event Sourcing

- [x] StockMovementRecorded domain event emitted for every stock change
- [x] Projection worker: subscribes to StockMovementRecorded, updates stock_items.quantityOnHand atomically
- [x] Replay command: can replay all events for a product/warehouse to recompute stock_items from scratch (used for integrity checks)
- [x] Commutativity invariant: quantityOnHand = sum(signed quantities) regardless of processing order

## Sync

- [x] stock_movement_events: Class A Ã¢â‚¬â€ replayed in arrival order, never conflicts
- [x] warehouses: Class B field-level HLC merge
- [x] stock_transfers: Class A for line receipt events, Class B for header fields

## Desktop UI

- [x] Inventory List page (`apps/desktop/src/features/inventory/InventoryListPage.tsx`): table with product name, SKU, warehouse, qty on hand (green/amber/red vs reorder point), batch count; filter by warehouse/category/below-reorder
- [x] Stock Adjustment Dialog: product search, warehouse selector, batch selector (FEFO order), quantity input, reason field, submit (with approval badge if threshold applies)
- [x] Stock Transfer Wizard: step 1 Ã¢â‚¬â€ select source/destination warehouses; step 2 Ã¢â‚¬â€ add product lines; step 3 Ã¢â‚¬â€ confirm and submit
- [x] Transfer Detail page: timeline showing state transitions, lines with shipped/received quantities

## Android UI

- [x] Same Inventory List, Adjustment Dialog, Transfer Wizard using shared components
- [x] Adjustment dialog as bottom-sheet on Android

## Property-Based Test

- [x] `stock-commutativity.property.test.ts`: generate random sequences of stock movement events (inward/outward/adjustment) for a product; apply in all possible orderings (fast-check permutations); assert final quantityOnHand is identical across all orderings

## Tests

- [x] See TESTS.md

### Quality Gates

- [x] Zero TypeScript errors
- [x] All tests passing
- [x] Update API.md if any endpoint contract was refined during implementation

