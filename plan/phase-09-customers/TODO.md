# Phase 09 — Suppliers TODO

## Database

- [ ] Create migration `009_suppliers_schema.ts`: suppliers, supplier_ledger_entries (append-only), supplier_price_history, supplier_contacts collections
- [ ] suppliers: index (companyId, isActive)
- [ ] supplier_ledger_entries: index (supplierId, occurredAt) — append-only enforced at repository layer
- [ ] supplier_price_history: index (supplierId, productId, recordedAt)
- [ ] JSON Schema: supplier_ledger_entries requires eventType enum(invoice/payment/credit_note/return_debit/adjustment), amount integer signed, referenceId
- [ ] JSON Schema: suppliers requires name (ar/en), phone, isActive boolean

## Domain — Supplier

- [ ] Implement `Supplier` aggregate: id, companyId, name (ar/en), phone, email?, address, taxId?, paymentTermsDays, currency (default EGP), isActive, contacts[]
- [ ] Implement `SupplierContact` value object: name, phone, email, role
- [ ] Implement `SupplierLedgerEntry` entity (append-only): id, supplierId, eventType, amount (signed integer Money), referenceType, referenceId, notes, occurredAt
- [ ] Implement supplier ledger balance projection: sum of signed amounts from all ledger entries for supplier
- [ ] Implement `SupplierPriceHistory` entity: id, supplierId, productId, unitPrice (Money), effectiveDate, recordedAt, purchaseOrderId
- [ ] Implement on-time delivery rate computation: count(receipts where receivedDate <= expectedDeliveryDate) / count(all receipts) for supplier in date range
- [ ] Implement price variance computation: (currentPrice - referencePrice) / referencePrice * 100 — deterministic, pure function, no AI

## Application — Use Cases

- [ ] `CreateSupplierCommand` + handler: validate phone uniqueness within company, create Supplier aggregate
- [ ] `UpdateSupplierCommand` + handler: field-level updates; contacts array replace-on-update
- [ ] `DeactivateSupplierCommand` + handler: soft-delete; reject if any open PO references supplier
- [ ] `RecordSupplierPaymentCommand` + handler: create SupplierLedgerEntry(payment); update balance projection
- [ ] `ApplySupplierCreditNoteCommand` + handler: create SupplierLedgerEntry(credit_note); update balance
- [ ] `GetSupplierLedgerQuery` + handler: paginated ledger entries with running balance
- [ ] `GetSupplierPerformanceQuery` + handler: compute on-time rate and price variance over date range — deterministic; LLM narrative slot present but returns stub string until Phase 15
- [ ] `GetSupplierPriceHistoryQuery` + handler: paginated price history for supplier (optionally filtered by product)

## API Endpoints

- [ ] `POST /v1/suppliers` — create
- [ ] `PATCH /v1/suppliers/:id` — update
- [ ] `DELETE /v1/suppliers/:id` — soft-delete (deactivate)
- [ ] `GET /v1/suppliers` — paginated list with search
- [ ] `GET /v1/suppliers/:id` — full detail
- [ ] `GET /v1/suppliers/:id/ledger` — paginated ledger
- [ ] `POST /v1/suppliers/:id/payments` — record payment
- [ ] `POST /v1/suppliers/:id/credit-notes` — apply credit note
- [ ] `GET /v1/suppliers/:id/performance` — on-time rate, price variance, narrative stub
- [ ] `GET /v1/suppliers/:id/price-history` — paginated

## Validation (Zod)

- [ ] `CreateSupplierSchema`: name object (ar required), phone string, email optional, paymentTermsDays positive integer, contacts optional array
- [ ] `RecordSupplierPaymentSchema`: amount positive integer, paymentMethod string, referenceNumber optional, notes optional
- [ ] `ApplySupplierCreditNoteSchema`: amount positive integer, referenceNumber optional, reason string

## Permissions

- [ ] Enforce `suppliers.view` on GET endpoints
- [ ] Enforce `suppliers.create` on POST /v1/suppliers
- [ ] Enforce `suppliers.edit` on PATCH and DELETE
- [ ] Enforce `suppliers.ledger.view` on ledger endpoint
- [ ] Enforce `suppliers.ledger.record` on payment and credit-note endpoints
- [ ] Enforce `suppliers.performance.view` on performance endpoint

## Sync

- [ ] suppliers: Class B field-level HLC merge
- [ ] supplier_ledger_entries: Class A (append-only)
- [ ] supplier_price_history: Class B (records are immutable after creation)

## Desktop UI

- [ ] Supplier List page: searchable table, balance indicator (positive = we owe, negative = supplier owes us), on-time rate sparkline
- [ ] Supplier Profile page: tabs — Overview, Ledger (paginated with running balance), Price History, Performance (metrics + narrative stub), Contacts
- [ ] Supplier Payment dialog: amount, payment method, reference number, notes
- [ ] Supplier Credit Note dialog: amount, reference, reason

## Android UI

- [ ] Same screens using shared components

## Tests

- [ ] See TESTS.md
