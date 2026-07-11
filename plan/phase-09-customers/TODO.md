# Phase 09 — Suppliers TODO

## Database

- [x] Create migration `009_suppliers_schema.ts`: suppliers, supplier_ledger_entries (append-only), supplier_price_history, supplier_contacts collections
- [x] suppliers: index (companyId, isActive)
- [x] supplier_ledger_entries: index (supplierId, occurredAt) — append-only enforced at repository layer
- [x] supplier_price_history: index (supplierId, productId, recordedAt)
- [x] JSON Schema: supplier_ledger_entries requires eventType enum(invoice/payment/credit_note/return_debit/adjustment), amount integer signed, referenceId
- [x] JSON Schema: suppliers requires name (ar/en), phone, isActive boolean

## Domain — Supplier

- [x] Implement `Supplier` aggregate: id, companyId, name (ar/en), phone, email?, address, taxId?, paymentTermsDays, currency (default EGP), isActive, contacts[]
- [x] Implement `SupplierContact` value object: name, phone, email, role
- [x] Implement `SupplierLedgerEntry` entity (append-only): id, supplierId, eventType, amount (signed integer Money), referenceType, referenceId, notes, occurredAt
- [x] Implement supplier ledger balance projection: sum of signed amounts from all ledger entries for supplier
- [x] Implement `SupplierPriceHistory` entity: id, supplierId, productId, unitPrice (Money), effectiveDate, recordedAt, purchaseOrderId
- [x] Implement on-time delivery rate computation: count(receipts where receivedDate <= expectedDeliveryDate) / count(all receipts) for supplier in date range
- [x] Implement price variance computation: (currentPrice - referencePrice) / referencePrice * 100 — deterministic, pure function, no AI

## Application — Use Cases

- [x] `CreateSupplierCommand` + handler: validate phone uniqueness within company, create Supplier aggregate
- [x] `UpdateSupplierCommand` + handler: field-level updates; contacts array replace-on-update
- [x] `DeactivateSupplierCommand` + handler: soft-delete; reject if any open PO references supplier
- [x] `RecordSupplierPaymentCommand` + handler: create SupplierLedgerEntry(payment); update balance projection
- [x] `ApplySupplierCreditNoteCommand` + handler: create SupplierLedgerEntry(credit_note); update balance
- [x] `GetSupplierLedgerQuery` + handler: paginated ledger entries with running balance
- [x] `GetSupplierPerformanceQuery` + handler: compute on-time rate and price variance over date range — deterministic; LLM narrative slot present but returns stub string until Phase 15
- [x] `GetSupplierPriceHistoryQuery` + handler: paginated price history for supplier (optionally filtered by product)

## API Endpoints

- [x] `POST /v1/suppliers` — create
- [x] `PATCH /v1/suppliers/:id` — update
- [x] `DELETE /v1/suppliers/:id` — soft-delete (deactivate)
- [x] `GET /v1/suppliers` — paginated list with search
- [x] `GET /v1/suppliers/:id` — full detail
- [x] `GET /v1/suppliers/:id/ledger` — paginated ledger
- [x] `POST /v1/suppliers/:id/payments` — record payment
- [x] `POST /v1/suppliers/:id/credit-notes` — apply credit note
- [x] `GET /v1/suppliers/:id/performance` — on-time rate, price variance, narrative stub
- [x] `GET /v1/suppliers/:id/price-history` — paginated

## Validation (Zod)

- [x] `CreateSupplierSchema`: name object (ar required), phone string, email optional, paymentTermsDays positive integer, contacts optional array
- [x] `RecordSupplierPaymentSchema`: amount positive integer, paymentMethod string, referenceNumber optional, notes optional
- [x] `ApplySupplierCreditNoteSchema`: amount positive integer, referenceNumber optional, reason string

## Permissions

- [x] Enforce `suppliers.view` on GET endpoints
- [x] Enforce `suppliers.create` on POST /v1/suppliers
- [x] Enforce `suppliers.edit` on PATCH and DELETE
- [x] Enforce `suppliers.ledger.view` on ledger endpoint
- [x] Enforce `suppliers.ledger.record` on payment and credit-note endpoints
- [x] Enforce `suppliers.performance.view` on performance endpoint

## Sync

- [x] suppliers: Class B field-level HLC merge
- [x] supplier_ledger_entries: Class A (append-only)
- [x] supplier_price_history: Class B (records are immutable after creation)

## Desktop UI

- [x] Supplier List page: searchable table, balance indicator (positive = we owe, negative = supplier owes us), on-time rate sparkline
- [x] Supplier Profile page: tabs — Overview, Ledger (paginated with running balance), Price History, Performance (metrics + narrative stub), Contacts
- [x] Supplier Payment dialog: amount, payment method, reference number, notes
- [x] Supplier Credit Note dialog: amount, reference, reason

## Android UI

- [x] Same screens using shared components

## Tests

- [x] See TESTS.md

### Quality Gates

- [x] Zero TypeScript errors
- [x] All tests passing
- [x] Update API.md if any endpoint contract was refined during implementation
