# Phase 06 — Purchases TODO
> ?? **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
> - **ALL UI text MUST use useT() / 	() with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use pps/backend/src/lib/errors.ts with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.

## Database

- [x] Create migration `006_purchases_schema.ts`: purchase_orders, purchase_order_lines, goods_receipts, goods_receipt_lines, goods_receipt_discrepancies, supplier_invoices collections
- [x] purchase_orders: index (companyId, status, createdAt), index (companyId, supplierId)
- [x] purchase_order_lines: index (purchaseOrderId)
- [x] goods_receipts: index (companyId, purchaseOrderId)
- [x] JSON Schema: purchase_orders requires status enum(draft/pending_approval/approved/partially_received/fully_received/cancelled), supplierId, branchId, expectedDeliveryDate
- [x] JSON Schema: goods_receipt_lines requires receivedQuantity integer, discrepancyType nullable enum(quantity_shortage/quality_rejection/wrong_item)

## Domain — Purchasing

- [x] Implement `PurchaseOrder` aggregate: id, companyId, branchId, supplierId, referenceNumber (auto-generated), status, lines[], notes, expectedDeliveryDate, totalAmount (Money)
- [x] Implement `PurchaseOrderLine` entity: id, purchaseOrderId, productId, variantId?, unitId, orderedQuantity, unitPrice (Money), receivedQuantity (updated on receipt)
- [x] Implement PO state machine: draft → pending_approval → approved → partially_received → fully_received; any state → cancelled (if not received)
- [x] Implement auto-approve rule: if totalAmount below company-configured threshold, transition directly to approved on submit
- [x] Implement `GoodsReceipt` aggregate: id, purchaseOrderId, receivedAt, receivedByUserId, lines[], discrepancies[]
- [x] Implement `Discrepancy` value object: type (quantity_shortage/quality_rejection/wrong_item), expectedQuantity, actualQuantity, notes
- [x] Implement `SupplierInvoice` entity: id, purchaseOrderId, invoiceNumber, invoiceDate, totalAmount, taxAmount, attachmentUrl, status (pending/matched/disputed)
- [x] Implement OCR stub domain service: accepts file reference, returns deterministic mock extracted data (supplierName, invoiceNumber, date, lineItems array, totalAmount) — replaced by real AI in Phase 15

## Application — Use Cases

- [x] `CreatePurchaseOrderCommand` + handler: validate supplierId, branchId, lines min 1; generate referenceNumber; emit PurchaseOrderCreated
- [x] `UpdatePurchaseOrderCommand` + handler: only in draft status; update lines and header fields
- [x] `SubmitForApprovalCommand` + handler: transition draft → pending_approval OR draft → approved (auto-approve); fire ApprovalRequested notification if goes to pending_approval
- [x] `ApprovePurchaseOrderCommand` + handler: requires purchasing.approve; transition pending_approval → approved; emit PurchaseOrderApproved
- [x] `RejectPurchaseOrderCommand` + handler: requires purchasing.approve; transition pending_approval → draft; record rejection reason
- [x] `CancelPurchaseOrderCommand` + handler: valid in draft/pending_approval/approved states only; emit PurchaseOrderCancelled
- [x] `ReceiveGoodsCommand` + handler: requires purchasing.receive; create GoodsReceipt; for each received line emit StockMovementRecorded(inward) to Phase 05 inventory; update PO receivedQuantity; transition PO to partially_received or fully_received based on totals; capture discrepancies
- [x] `RecordDiscrepancyCommand` + handler: add discrepancy record to goods receipt
- [x] `RecordSupplierInvoiceCommand` + handler: create SupplierInvoice record; update supplier ledger (Phase 09)
- [x] `UploadInvoiceForOcrCommand` + handler: accepts file reference, calls OCR stub service, returns extracted data to UI for review and confirmation — does not auto-apply

## API Endpoints

- [x] `POST /v1/purchase-orders` — create PO
- [x] `PATCH /v1/purchase-orders/:id` — update (draft only)
- [x] `GET /v1/purchase-orders` — paginated list with filters: status, supplierId, dateRange
- [x] `GET /v1/purchase-orders/:id` — full detail with lines and receipts
- [x] `POST /v1/purchase-orders/:id/submit` — submit for approval
- [x] `POST /v1/purchase-orders/:id/approve`
- [x] `POST /v1/purchase-orders/:id/reject` — body: reason string
- [x] `POST /v1/purchase-orders/:id/cancel` — body: reason string
- [x] `POST /v1/purchase-orders/:id/receive` — body: lines with received quantities and discrepancy flags
- [x] `POST /v1/purchase-orders/:id/invoice` — record supplier invoice
- [x] `POST /v1/purchase-orders/:id/ocr` — upload invoice image, return extracted data (stub)

## Validation (Zod)

- [x] `CreatePurchaseOrderSchema`: supplierId UUIDv7, branchId UUIDv7, expectedDeliveryDate ISO date, lines array min 1 (productId, quantity, unitPrice)
- [x] `ReceiveGoodsSchema`: lines array, each with lineId, receivedQuantity, discrepancyType optional, discrepancyNotes optional
- [x] `RejectPurchaseOrderSchema`: reason string min 10
- [x] `RecordSupplierInvoiceSchema`: invoiceNumber string, invoiceDate ISO date, totalAmount positive integer, taxAmount nonneg integer

## Permissions

- [x] Enforce `purchasing.view` on GET endpoints
- [x] Enforce `purchasing.create` on POST /v1/purchase-orders
- [x] Enforce `purchasing.edit` on PATCH
- [x] Enforce `purchasing.approve` on approve and reject endpoints
- [x] Enforce `purchasing.receive` on receive endpoint
- [x] Enforce `purchasing.invoice.record` on invoice endpoint

## Sync

- [x] purchase_orders: Class B field-level HLC merge for header fields
- [x] goods_receipt_lines: Class A (append-only receipt events, never overwritten)
- [x] supplier_invoices: Class B

## Desktop UI

- [x] Purchase Order List page: table with PO number, supplier, date, status badge, total; filterable; "Create PO" button
- [x] PO Create/Edit form: supplier selector, delivery date, line items (product search, quantity, price)
- [x] PO Detail page: header info, approval timeline, lines with received progress, receipt history, discrepancy flags, invoice tab
- [x] Goods Receipt screen: line-by-line quantity entry, discrepancy flag toggle per line, notes field, submit button
- [x] OCR upload button on PO form: opens file picker, shows mock extracted data panel for user review and manual correction before applying

## Android UI

- [x] Same screens as Desktop using shared components
- [x] PO form and receipt screen as scrollable single-column with bottom-sheet selectors

## Tests

- [x] See TESTS.md (unit + integration + permission + OCR + sync tests implemented; E2E critical-flow tests require a running server environment)

### Quality Gates

- [x] Zero TypeScript errors
- [x] All tests passing
- [x] Update API.md if any endpoint contract was refined during implementation
