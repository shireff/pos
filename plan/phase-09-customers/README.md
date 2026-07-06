# Phase 09 — Suppliers

## Purpose

Supplier management, supplier ledger (payments, credit notes, returns, price history), and supplier performance metrics. Performance metrics (on-time delivery percentage, price variance) are computed from deterministic formulas applied to structured data — the LLM generates a narrative summary of the metrics but never the metrics themselves.

## Scope

- **Database**: suppliers, supplier_ledger_entries (append-only), supplier_price_history, supplier_contacts collections
- **Domain**: Supplier aggregate, SupplierLedgerEntry entity (append-only), SupplierPriceHistory entity, SupplierContact value object
- **Business Logic**: supplier ledger balance (sum of signed amounts from append-only entries), on-time delivery rate (received_on_time_count / total_deliveries), price variance (current_price - reference_price) / reference_price), supplier credit note application, supplier payment recording
- **Application**: CreateSupplierCommand, UpdateSupplierCommand, RecordSupplierPaymentCommand, ApplySupplierCreditNoteCommand, GetSupplierLedgerQuery, GetSupplierPerformanceQuery, GetSupplierPriceHistoryQuery
- **API**: POST /v1/suppliers, PATCH /v1/suppliers/:id, GET /v1/suppliers, GET /v1/suppliers/:id, GET /v1/suppliers/:id/ledger, POST /v1/suppliers/:id/payments, POST /v1/suppliers/:id/credit-notes, GET /v1/suppliers/:id/performance, GET /v1/suppliers/:id/price-history
- **Permissions**: suppliers.view, suppliers.create, suppliers.edit, suppliers.ledger.view, suppliers.ledger.record, suppliers.performance.view
- **Sync**: Class B field-level HLC merge for supplier profile fields; supplier_ledger_entries are Class A (append-only)
- **Desktop UI**: Supplier List (searchable, with balance and performance indicators), Supplier Profile screen (tabs: Overview, Ledger, Price History, Performance, Contacts), Supplier Payment dialog, Credit Note dialog
- **Android UI**: same screens using shared components

## Expected Output

A working supplier module where:

- Suppliers can be created, updated, and soft-deleted
- Ledger balance is always derived from append-only entries — never a raw field update
- On-time delivery and price variance metrics are computed deterministically from structured data
- Performance screen shows deterministic figures; LLM narrative (Phase 15) slot is present but shows stub text until Phase 15 completes

## Documents Referenced

- Database.md §2.12
- Reports.md §2.10
- Business_Rules.md §7

## Included Modules

- `packages/domain/purchasing/src/aggregates/supplier.aggregate.ts`
- `packages/domain/purchasing/src/entities/supplier-ledger-entry.entity.ts`
- `packages/domain/purchasing/src/entities/supplier-price-history.entity.ts`
- `packages/application/purchasing/src/suppliers/*`
- `packages/infrastructure/mongodb/migrations/009_suppliers_schema.ts`
- `packages/infrastructure/mongodb/repositories/supplier.repository.ts`
- `packages/infrastructure/mongodb/repositories/supplier-ledger-entry.repository.ts`
- `apps/backend/src/http/suppliers/*`
- `packages/ui-components/src/suppliers/*`
- `apps/desktop/src/features/suppliers/*`
- `apps/android/src/features/suppliers/*`
