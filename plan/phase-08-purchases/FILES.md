# Phase 08 — Customers Files

## Database Migrations & Schemas

```
packages/infrastructure/mongodb/migrations/008_customers_schema.ts
packages/infrastructure/mongodb/schemas/customers.schema.json
packages/infrastructure/mongodb/schemas/loyalty_accounts.schema.json
packages/infrastructure/mongodb/schemas/loyalty_events.schema.json
packages/infrastructure/mongodb/schemas/credit_ledger_entries.schema.json
```

## Domain — CRM

```
packages/domain/crm/src/aggregates/customer.aggregate.ts
packages/domain/crm/src/aggregates/customer.aggregate.test.ts
packages/domain/crm/src/aggregates/loyalty-account.aggregate.ts
packages/domain/crm/src/aggregates/loyalty-account.aggregate.test.ts
packages/domain/crm/src/aggregates/credit-ledger.aggregate.ts
packages/domain/crm/src/aggregates/credit-ledger.aggregate.test.ts
packages/domain/crm/src/entities/loyalty-event.entity.ts
packages/domain/crm/src/entities/credit-ledger-entry.entity.ts
packages/domain/crm/src/domain-services/loyalty-accrual.service.ts
packages/domain/crm/src/domain-services/loyalty-accrual.service.test.ts
packages/domain/crm/src/domain-services/credit-limit-guard.service.ts
packages/domain/crm/src/domain-services/customer-merge.service.ts
packages/domain/crm/src/domain-services/customer-merge.service.test.ts
packages/domain/crm/src/domain-events/customer-created.event.ts
packages/domain/crm/src/domain-events/loyalty-points-accrued.event.ts
packages/domain/crm/src/domain-events/loyalty-points-redeemed.event.ts
packages/domain/crm/src/domain-events/loyalty-points-reversed.event.ts
packages/domain/crm/README.md
packages/domain/crm/src/index.ts
```

## Application — CRM Use Cases

```
packages/application/crm/src/create-customer/create-customer.command.ts
packages/application/crm/src/create-customer/create-customer.handler.ts
packages/application/crm/src/update-customer/update-customer.command.ts
packages/application/crm/src/update-customer/update-customer.handler.ts
packages/application/crm/src/merge-customers/merge-customers.command.ts
packages/application/crm/src/merge-customers/merge-customers.handler.ts
packages/application/crm/src/merge-customers/merge-customers.handler.test.ts
packages/application/crm/src/accrue-loyalty/accrue-loyalty-points.command.ts
packages/application/crm/src/accrue-loyalty/accrue-loyalty-points.handler.ts
packages/application/crm/src/redeem-loyalty/redeem-loyalty-points.command.ts
packages/application/crm/src/redeem-loyalty/redeem-loyalty-points.handler.ts
packages/application/crm/src/reverse-loyalty/reverse-loyalty-points.command.ts
packages/application/crm/src/reverse-loyalty/reverse-loyalty-points.handler.ts
packages/application/crm/src/record-credit-payment/record-credit-payment.command.ts
packages/application/crm/src/record-credit-payment/record-credit-payment.handler.ts
packages/application/crm/src/get-customer/get-customer.query.ts
packages/application/crm/src/get-customer/get-customer.handler.ts
packages/application/crm/src/search-customers/search-customers.query.ts
packages/application/crm/src/search-customers/search-customers.handler.ts
packages/application/crm/src/index.ts
```

## Infrastructure — Repositories

```
packages/infrastructure/mongodb/repositories/customer.repository.ts
packages/infrastructure/mongodb/repositories/loyalty-event.repository.ts
packages/infrastructure/mongodb/repositories/credit-ledger-entry.repository.ts
```

## API (Backend)

```
apps/backend/src/http/customers/customers.controller.ts
apps/backend/src/http/customers/customers.controller.test.ts
apps/backend/src/http/customers/customers.schemas.ts
```

## Shared UI Components

```
packages/ui-components/src/customers/CustomerCard.tsx
packages/ui-components/src/customers/LoyaltyTierBadge.tsx
packages/ui-components/src/customers/LoyaltyRedemptionDialog.tsx
packages/ui-components/src/customers/CustomerSearchSheet.tsx
packages/ui-components/src/customers/index.ts
```

## Desktop UI

```
apps/desktop/src/features/customers/CustomerListPage.tsx
apps/desktop/src/features/customers/CustomerProfilePage.tsx
apps/desktop/src/features/customers/tabs/OverviewTab.tsx
apps/desktop/src/features/customers/tabs/LoyaltyHistoryTab.tsx
apps/desktop/src/features/customers/tabs/CreditHistoryTab.tsx
apps/desktop/src/features/customers/tabs/PurchaseHistoryTab.tsx
```

## Android UI

```
apps/android/src/features/customers/CustomerListPage.tsx
apps/android/src/features/customers/CustomerProfilePage.tsx
```

## State Management

```
packages/ui-components/src/stores/customers.store.ts
```
