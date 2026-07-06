# Phase 09 — Suppliers Files

## Database Migrations & Schemas

```
packages/infrastructure/mongodb/migrations/009_suppliers_schema.ts
packages/infrastructure/mongodb/schemas/suppliers.schema.json
packages/infrastructure/mongodb/schemas/supplier_ledger_entries.schema.json
packages/infrastructure/mongodb/schemas/supplier_price_history.schema.json
packages/infrastructure/mongodb/schemas/supplier_contacts.schema.json
```

## Domain — Suppliers (in purchasing bounded context)

```
packages/domain/purchasing/src/aggregates/supplier.aggregate.ts
packages/domain/purchasing/src/aggregates/supplier.aggregate.test.ts
packages/domain/purchasing/src/entities/supplier-ledger-entry.entity.ts
packages/domain/purchasing/src/entities/supplier-price-history.entity.ts
packages/domain/purchasing/src/value-objects/supplier-contact.vo.ts
packages/domain/purchasing/src/domain-services/supplier-performance.service.ts
packages/domain/purchasing/src/domain-services/supplier-performance.service.test.ts
packages/domain/purchasing/src/domain-events/supplier-created.event.ts
packages/domain/purchasing/src/domain-events/supplier-payment-recorded.event.ts
```

## Application — Supplier Use Cases

```
packages/application/purchasing/src/suppliers/create-supplier.command.ts
packages/application/purchasing/src/suppliers/create-supplier.handler.ts
packages/application/purchasing/src/suppliers/update-supplier.command.ts
packages/application/purchasing/src/suppliers/update-supplier.handler.ts
packages/application/purchasing/src/suppliers/deactivate-supplier.command.ts
packages/application/purchasing/src/suppliers/deactivate-supplier.handler.ts
packages/application/purchasing/src/suppliers/record-supplier-payment.command.ts
packages/application/purchasing/src/suppliers/record-supplier-payment.handler.ts
packages/application/purchasing/src/suppliers/apply-credit-note.command.ts
packages/application/purchasing/src/suppliers/apply-credit-note.handler.ts
packages/application/purchasing/src/suppliers/get-supplier-ledger.query.ts
packages/application/purchasing/src/suppliers/get-supplier-ledger.handler.ts
packages/application/purchasing/src/suppliers/get-supplier-performance.query.ts
packages/application/purchasing/src/suppliers/get-supplier-performance.handler.ts
packages/application/purchasing/src/suppliers/get-supplier-price-history.query.ts
packages/application/purchasing/src/suppliers/get-supplier-price-history.handler.ts
```

## Infrastructure — Repositories

```
packages/infrastructure/mongodb/repositories/supplier.repository.ts
packages/infrastructure/mongodb/repositories/supplier-ledger-entry.repository.ts
packages/infrastructure/mongodb/repositories/supplier-ledger-entry.repository.test.ts
packages/infrastructure/mongodb/repositories/supplier-price-history.repository.ts
```

## API (Backend)

```
apps/backend/src/http/suppliers/suppliers.controller.ts
apps/backend/src/http/suppliers/suppliers.controller.test.ts
apps/backend/src/http/suppliers/suppliers.schemas.ts
```

## Shared UI Components

```
packages/ui-components/src/suppliers/SupplierBalanceBadge.tsx
packages/ui-components/src/suppliers/SupplierPaymentDialog.tsx
packages/ui-components/src/suppliers/SupplierCreditNoteDialog.tsx
packages/ui-components/src/suppliers/index.ts
```

## Desktop UI

```
apps/desktop/src/features/suppliers/SupplierListPage.tsx
apps/desktop/src/features/suppliers/SupplierProfilePage.tsx
apps/desktop/src/features/suppliers/tabs/LedgerTab.tsx
apps/desktop/src/features/suppliers/tabs/PriceHistoryTab.tsx
apps/desktop/src/features/suppliers/tabs/PerformanceTab.tsx
apps/desktop/src/features/suppliers/tabs/ContactsTab.tsx
```

## Android UI

```
apps/android/src/features/suppliers/SupplierListPage.tsx
apps/android/src/features/suppliers/SupplierProfilePage.tsx
```

## State Management

```
packages/ui-components/src/stores/suppliers.store.ts
```
