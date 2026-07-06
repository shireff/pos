# Phase 06 — Purchases Files

## Database Migrations & Schemas

```
packages/infrastructure/mongodb/migrations/006_purchases_schema.ts
packages/infrastructure/mongodb/schemas/purchase_orders.schema.json
packages/infrastructure/mongodb/schemas/purchase_order_lines.schema.json
packages/infrastructure/mongodb/schemas/goods_receipts.schema.json
packages/infrastructure/mongodb/schemas/goods_receipt_lines.schema.json
packages/infrastructure/mongodb/schemas/supplier_invoices.schema.json
```

## Domain — Purchasing

```
packages/domain/purchasing/src/aggregates/purchase-order.aggregate.ts
packages/domain/purchasing/src/aggregates/purchase-order.aggregate.test.ts
packages/domain/purchasing/src/aggregates/goods-receipt.aggregate.ts
packages/domain/purchasing/src/entities/purchase-order-line.entity.ts
packages/domain/purchasing/src/entities/supplier-invoice.entity.ts
packages/domain/purchasing/src/value-objects/discrepancy.vo.ts
packages/domain/purchasing/src/domain-services/ocr-stub.service.ts
packages/domain/purchasing/src/domain-services/po-auto-approve.service.ts
packages/domain/purchasing/src/domain-events/purchase-order-created.event.ts
packages/domain/purchasing/src/domain-events/purchase-order-approved.event.ts
packages/domain/purchasing/src/domain-events/purchase-order-cancelled.event.ts
packages/domain/purchasing/src/domain-events/goods-received.event.ts
packages/domain/purchasing/README.md
packages/domain/purchasing/src/index.ts
```

## Application — Purchasing Use Cases

```
packages/application/purchasing/src/create-po/create-purchase-order.command.ts
packages/application/purchasing/src/create-po/create-purchase-order.handler.ts
packages/application/purchasing/src/update-po/update-purchase-order.command.ts
packages/application/purchasing/src/update-po/update-purchase-order.handler.ts
packages/application/purchasing/src/submit-po/submit-for-approval.command.ts
packages/application/purchasing/src/submit-po/submit-for-approval.handler.ts
packages/application/purchasing/src/approve-po/approve-purchase-order.command.ts
packages/application/purchasing/src/approve-po/approve-purchase-order.handler.ts
packages/application/purchasing/src/reject-po/reject-purchase-order.command.ts
packages/application/purchasing/src/reject-po/reject-purchase-order.handler.ts
packages/application/purchasing/src/cancel-po/cancel-purchase-order.command.ts
packages/application/purchasing/src/cancel-po/cancel-purchase-order.handler.ts
packages/application/purchasing/src/receive-goods/receive-goods.command.ts
packages/application/purchasing/src/receive-goods/receive-goods.handler.ts
packages/application/purchasing/src/receive-goods/receive-goods.handler.test.ts
packages/application/purchasing/src/record-invoice/record-supplier-invoice.command.ts
packages/application/purchasing/src/record-invoice/record-supplier-invoice.handler.ts
packages/application/purchasing/src/upload-ocr/upload-invoice-for-ocr.command.ts
packages/application/purchasing/src/upload-ocr/upload-invoice-for-ocr.handler.ts
packages/application/purchasing/src/index.ts
```

## Infrastructure — Repositories

```
packages/infrastructure/mongodb/repositories/purchase-order.repository.ts
packages/infrastructure/mongodb/repositories/purchase-order.repository.test.ts
packages/infrastructure/mongodb/repositories/goods-receipt.repository.ts
packages/infrastructure/mongodb/repositories/supplier-invoice.repository.ts
```

## API (Backend)

```
apps/backend/src/http/purchases/purchases.controller.ts
apps/backend/src/http/purchases/purchases.controller.test.ts
apps/backend/src/http/purchases/purchases.schemas.ts
```

## Shared UI Components

```
packages/ui-components/src/purchases/PurchaseOrderStatusBadge.tsx
packages/ui-components/src/purchases/DiscrepancyFlag.tsx
packages/ui-components/src/purchases/OcrReviewPanel.tsx
packages/ui-components/src/purchases/index.ts
```

## Desktop UI

```
apps/desktop/src/features/purchases/PurchaseOrderListPage.tsx
apps/desktop/src/features/purchases/PurchaseOrderFormPage.tsx
apps/desktop/src/features/purchases/PurchaseOrderDetailPage.tsx
apps/desktop/src/features/purchases/GoodsReceiptPage.tsx
```

## Android UI

```
apps/android/src/features/purchases/PurchaseOrderListPage.tsx
apps/android/src/features/purchases/PurchaseOrderFormPage.tsx
apps/android/src/features/purchases/PurchaseOrderDetailPage.tsx
apps/android/src/features/purchases/GoodsReceiptPage.tsx
```

## State Management

```
packages/ui-components/src/stores/purchases.store.ts
```
