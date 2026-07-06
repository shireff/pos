# Phase 10 — Payments Files

## Database Migrations & Schemas

```
packages/infrastructure/mongodb/migrations/010_payments_schema.ts
packages/infrastructure/mongodb/schemas/payment_transactions.schema.json
packages/infrastructure/mongodb/schemas/payment_methods.schema.json
packages/infrastructure/mongodb/schemas/payment_provider_registry.schema.json
```

## Domain — Sales (Payments)

```
packages/domain/sales/src/interfaces/payment-provider.interface.ts
packages/domain/sales/src/value-objects/split-tender.vo.ts
packages/domain/sales/src/entities/payment-method.entity.ts
packages/domain/sales/src/domain-events/payment-completed.event.ts
packages/domain/sales/src/domain-events/payment-refunded.event.ts
```

## Payment Provider Implementations

```
packages/infrastructure/payment-providers/cash.provider.ts
packages/infrastructure/payment-providers/cash.provider.test.ts
packages/infrastructure/payment-providers/card-manual.provider.ts
packages/infrastructure/payment-providers/vodafone-cash.provider.ts
packages/infrastructure/payment-providers/orange-cash.provider.ts
packages/infrastructure/payment-providers/etisalat-cash.provider.ts
packages/infrastructure/payment-providers/we-pay.provider.ts
packages/infrastructure/payment-providers/instapay.provider.ts
packages/infrastructure/payment-providers/bank-transfer.provider.ts
packages/infrastructure/payment-providers/customer-credit.provider.ts
packages/infrastructure/payment-providers/customer-credit.provider.test.ts
packages/infrastructure/payment-providers/store-credit.provider.ts
packages/infrastructure/payment-providers/index.ts
```

## Application — Payment Use Cases

```
packages/application/sales/src/payments/process-payment.command.ts
packages/application/sales/src/payments/process-payment.handler.ts
packages/application/sales/src/payments/process-payment.handler.test.ts
packages/application/sales/src/payments/refund-payment.command.ts
packages/application/sales/src/payments/refund-payment.handler.ts
packages/application/sales/src/payments/get-payment-methods.query.ts
packages/application/sales/src/payments/get-payment-methods.handler.ts
```

## Infrastructure — Repositories

```
packages/infrastructure/mongodb/repositories/payment-transaction.repository.ts
packages/infrastructure/mongodb/repositories/payment-transaction.repository.test.ts
packages/infrastructure/mongodb/repositories/payment-method.repository.ts
```

## API (Backend)

```
apps/backend/src/http/payments/payments.controller.ts
apps/backend/src/http/payments/payments.controller.test.ts
apps/backend/src/http/payments/payments.schemas.ts
```

## Shared UI Components

```
packages/ui-components/src/payments/PaymentPanel.tsx
packages/ui-components/src/payments/PaymentPanel.test.tsx
packages/ui-components/src/payments/SplitPaymentRow.tsx
packages/ui-components/src/payments/RefundPaymentDialog.tsx
packages/ui-components/src/payments/index.ts
```

## Desktop UI (PaymentPanel is embedded in POS Register page)

```
apps/desktop/src/features/pos/PosRegisterPage.tsx (updated to include PaymentPanel)
```

## Android UI

```
apps/android/src/features/pos/PaymentSheet.tsx
```
