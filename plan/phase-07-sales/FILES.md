# Phase 07 — Sales (POS) Files

## Database Migrations & Schemas

```
packages/infrastructure/mongodb/migrations/007_sales_schema.ts
packages/infrastructure/mongodb/schemas/orders.schema.json
packages/infrastructure/mongodb/schemas/order_lines.schema.json
packages/infrastructure/mongodb/schemas/payments.schema.json
packages/infrastructure/mongodb/schemas/returns.schema.json
packages/infrastructure/mongodb/schemas/return_lines.schema.json
packages/infrastructure/mongodb/schemas/shift_sessions.schema.json
```

## Domain — Sales

```
packages/domain/sales/src/aggregates/order.aggregate.ts
packages/domain/sales/src/aggregates/order.aggregate.test.ts
packages/domain/sales/src/aggregates/return.aggregate.ts
packages/domain/sales/src/aggregates/return.aggregate.test.ts
packages/domain/sales/src/aggregates/shift-session.aggregate.ts
packages/domain/sales/src/entities/order-line.entity.ts
packages/domain/sales/src/entities/payment.entity.ts
packages/domain/sales/src/entities/return-line.entity.ts
packages/domain/sales/src/value-objects/split-tender.vo.ts
packages/domain/sales/src/value-objects/split-tender.vo.test.ts
packages/domain/sales/src/domain-services/idempotency-guard.service.ts
packages/domain/sales/src/domain-services/bundle-sale-deduction.service.ts
packages/domain/sales/src/domain-services/return-approval-threshold.service.ts
packages/domain/sales/src/domain-events/order-completed.event.ts
packages/domain/sales/src/domain-events/return-approved.event.ts
packages/domain/sales/src/domain-events/sale-voided.event.ts
packages/domain/sales/src/domain-events/shift-opened.event.ts
packages/domain/sales/src/domain-events/shift-closed.event.ts
packages/domain/sales/README.md
packages/domain/sales/src/index.ts
```

## Application — Sales Use Cases

```
packages/application/sales/src/create-sale/create-sale.command.ts
packages/application/sales/src/create-sale/create-sale.handler.ts
packages/application/sales/src/create-sale/create-sale.handler.test.ts
packages/application/sales/src/process-return/process-return.command.ts
packages/application/sales/src/process-return/process-return.handler.ts
packages/application/sales/src/process-return/process-return.handler.test.ts
packages/application/sales/src/approve-return/approve-return.command.ts
packages/application/sales/src/approve-return/approve-return.handler.ts
packages/application/sales/src/void-sale/void-sale.command.ts
packages/application/sales/src/void-sale/void-sale.handler.ts
packages/application/sales/src/open-drawer-session/open-drawer-session.command.ts
packages/application/sales/src/open-drawer-session/open-drawer-session.handler.ts
packages/application/sales/src/open-shift/open-shift.command.ts
packages/application/sales/src/open-shift/open-shift.handler.ts
packages/application/sales/src/close-shift/close-shift.command.ts
packages/application/sales/src/close-shift/close-shift.handler.ts
packages/application/sales/src/get-order/get-order.query.ts
packages/application/sales/src/get-order/get-order.handler.ts
packages/application/sales/src/get-shift-summary/get-shift-summary.query.ts
packages/application/sales/src/get-shift-summary/get-shift-summary.handler.ts
packages/application/sales/src/index.ts
```

## Infrastructure — Repositories

```
packages/infrastructure/mongodb/repositories/order.repository.ts
packages/infrastructure/mongodb/repositories/order.repository.test.ts
packages/infrastructure/mongodb/repositories/payment.repository.ts
packages/infrastructure/mongodb/repositories/return.repository.ts
packages/infrastructure/mongodb/repositories/shift-session.repository.ts
```

## API (Backend)

```
apps/backend/src/http/sales/orders.controller.ts
apps/backend/src/http/sales/orders.controller.test.ts
apps/backend/src/http/sales/orders.schemas.ts
apps/backend/src/http/sales/shifts.controller.ts
apps/backend/src/http/sales/shifts.schemas.ts
```

## Benchmark

```
apps/backend/src/benchmark/pos-sale-benchmark.ts
```

## Shared UI Components

```
packages/ui-components/src/pos/CartItem.tsx
packages/ui-components/src/pos/PaymentPanel.tsx
packages/ui-components/src/pos/ShiftSummaryDialog.tsx
packages/ui-components/src/pos/DigitalReceiptModal.tsx
packages/ui-components/src/pos/index.ts
```

## Desktop UI

```
apps/desktop/src/features/pos/PosRegisterPage.tsx
apps/desktop/src/features/pos/PosRegisterPage.test.tsx
apps/desktop/src/features/pos/ShiftCloseSummary.tsx
```

## Android UI

```
apps/android/src/features/pos/PosRegisterPage.tsx
apps/android/src/features/pos/CameraBarcodeScanButton.tsx
```

## State Management

```
packages/ui-components/src/stores/pos.store.ts
packages/ui-components/src/stores/shift.store.ts
```
