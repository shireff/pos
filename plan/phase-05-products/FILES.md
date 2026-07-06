# Phase 05 — Inventory & Warehouses Files

## Database Migrations & Schemas

```
packages/infrastructure/mongodb/migrations/005_inventory_schema.ts
packages/infrastructure/mongodb/schemas/stock_items.schema.json
packages/infrastructure/mongodb/schemas/stock_movement_events.schema.json
packages/infrastructure/mongodb/schemas/batches.schema.json
packages/infrastructure/mongodb/schemas/warehouses.schema.json
packages/infrastructure/mongodb/schemas/stock_transfers.schema.json
packages/infrastructure/mongodb/schemas/stock_transfer_lines.schema.json
```

## Domain — Inventory

```
packages/domain/inventory/src/aggregates/warehouse.aggregate.ts
packages/domain/inventory/src/aggregates/warehouse.aggregate.test.ts
packages/domain/inventory/src/aggregates/stock-item.aggregate.ts
packages/domain/inventory/src/aggregates/stock-transfer.aggregate.ts
packages/domain/inventory/src/aggregates/stock-transfer.aggregate.test.ts
packages/domain/inventory/src/entities/stock-movement-event.entity.ts
packages/domain/inventory/src/entities/batch.entity.ts
packages/domain/inventory/src/domain-services/negative-stock-guard.service.ts
packages/domain/inventory/src/domain-services/negative-stock-guard.service.test.ts
packages/domain/inventory/src/domain-services/fefo-suggestion.service.ts
packages/domain/inventory/src/domain-services/fefo-suggestion.service.test.ts
packages/domain/inventory/src/domain-services/stock-projection.service.ts
packages/domain/inventory/src/domain-services/stock-projection.service.test.ts
packages/domain/inventory/src/domain-events/stock-movement-recorded.event.ts
packages/domain/inventory/src/domain-events/transfer-status-changed.event.ts
packages/domain/inventory/src/domain-events/reorder-point-reached.event.ts
packages/domain/inventory/README.md
packages/domain/inventory/src/index.ts
```

## Application — Inventory Use Cases

```
packages/application/inventory/src/adjust-stock/adjust-stock.command.ts
packages/application/inventory/src/adjust-stock/adjust-stock.handler.ts
packages/application/inventory/src/adjust-stock/adjust-stock.handler.test.ts
packages/application/inventory/src/approve-adjustment/approve-adjustment.command.ts
packages/application/inventory/src/approve-adjustment/approve-adjustment.handler.ts
packages/application/inventory/src/transfer-stock/transfer-stock.command.ts
packages/application/inventory/src/transfer-stock/transfer-stock.handler.ts
packages/application/inventory/src/approve-transfer/approve-transfer.command.ts
packages/application/inventory/src/approve-transfer/approve-transfer.handler.ts
packages/application/inventory/src/ship-transfer/ship-transfer.command.ts
packages/application/inventory/src/ship-transfer/ship-transfer.handler.ts
packages/application/inventory/src/receive-transfer/receive-transfer.command.ts
packages/application/inventory/src/receive-transfer/receive-transfer.handler.ts
packages/application/inventory/src/cancel-transfer/cancel-transfer.command.ts
packages/application/inventory/src/cancel-transfer/cancel-transfer.handler.ts
packages/application/inventory/src/get-stock-levels/get-stock-levels.query.ts
packages/application/inventory/src/get-stock-levels/get-stock-levels.handler.ts
packages/application/inventory/src/get-stock-movements/get-stock-movements.query.ts
packages/application/inventory/src/get-stock-movements/get-stock-movements.handler.ts
packages/application/inventory/src/projection-worker/stock-projection-worker.ts
packages/application/inventory/src/index.ts
```

## Infrastructure — Repositories

```
packages/infrastructure/mongodb/repositories/stock-movement-event.repository.ts
packages/infrastructure/mongodb/repositories/stock-movement-event.repository.test.ts
packages/infrastructure/mongodb/repositories/stock-item.repository.ts
packages/infrastructure/mongodb/repositories/warehouse.repository.ts
packages/infrastructure/mongodb/repositories/batch.repository.ts
packages/infrastructure/mongodb/repositories/stock-transfer.repository.ts
```

## API (Backend)

```
apps/backend/src/http/inventory/stock.controller.ts
apps/backend/src/http/inventory/stock.controller.test.ts
apps/backend/src/http/inventory/stock.schemas.ts
apps/backend/src/http/inventory/warehouses.controller.ts
apps/backend/src/http/inventory/warehouses.schemas.ts
```

## Property-Based Tests

```
packages/application/inventory/src/tests/stock-commutativity.property.test.ts
```

## Shared UI Components

```
packages/ui-components/src/inventory/StockLevelBadge.tsx
packages/ui-components/src/inventory/WarehouseSelector.tsx
packages/ui-components/src/inventory/BatchSelector.tsx
packages/ui-components/src/inventory/index.ts
```

## Desktop UI

```
apps/desktop/src/features/inventory/InventoryListPage.tsx
apps/desktop/src/features/inventory/StockAdjustmentDialog.tsx
apps/desktop/src/features/inventory/StockTransferWizard.tsx
apps/desktop/src/features/inventory/TransferDetailPage.tsx
```

## Android UI

```
apps/android/src/features/inventory/InventoryListPage.tsx
apps/android/src/features/inventory/StockAdjustmentSheet.tsx
apps/android/src/features/inventory/StockTransferWizard.tsx
```

## State Management

```
packages/ui-components/src/stores/inventory.store.ts
```
