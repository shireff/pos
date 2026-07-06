# Phase 06 — Purchases TODO

## Database

- [ ] Create migration `006_purchases_schema.ts`: purchase_orders, purchase_order_lines, goods_receipts, goods_receipt_lines, goods_receipt_discrepancies, supplier_invoices collections
- [ ] purchase_orders: index (companyId, status, createdAt), index (companyId, supplierId)
- [ ] purchase_order_lines: index (purchaseOrderId)
- [ ] goods_receipts: index (companyId, purchaseOrderId)
- [ ] JSON Schema: purchase_orders requires status enum(draft/pending_approval/approved/partially_received/fully_received/cancelled), supplierId, branchId, expectedDeliveryDate
- [ ] JSON Schema: goods_receipt_lines requires receivedQuantity integer, discrepancyType nullable enum(quantity_shortage/quality_rejection/wrong_item)

## Domain — Purchasing

- [ ] Implement `PurchaseOrder` aggregate: id, companyId, branchId, supplierId, referenceNumber (auto-generated), status, lines[], notes, expectedDeliveryDate, totalAmount (Money)
- [ ] Implement `PurchaseOrderLine` entity: id, purchaseOrderId, productId, variantId?, unitId, orderedQuantity, unitPrice (Money), receivedQuantity (updated on receipt)
- [ ] Implement PO state machine: draft → pending_approval → approved → partially_received → fully_received; any state → cancelled (if not received)
- [ ] Implement auto-approve rule: if totalAmount below company-configured threshold, transition directly to approved on submit
- [ ] Implement `GoodsReceipt` aggregate: id, purchaseOrderId, receivedAt, receivedByUserId, lines[], discrepancies[]
- [ ] Implement `Discrepancy` value object: type (quantity_shortage/quality_rejection/wrong_item), expectedQuantity, actualQuantity, notes
- [ ] Implement `SupplierInvoice` entity: id, purchaseOrderId, invoiceNumber, invoiceDate, totalAmount, taxAmount, attachmentUrl, status (pending/matched/disputed)
- [ ] Implement OCR stub domain service: accepts file reference, returns deterministic mock extracted data (supplierName, invoiceNumber, date, lineItems array, totalAmount) — replaced by real AI in Phase 15

## Application — Use Cases

- [ ] `CreatePurchaseOrderCommand` + handler: validate supplierId, branchId, lines min 1; generate referenceNumber; emit PurchaseOrderCreated
- [ ] `UpdatePurchaseOrderCommand` + handler: only in draft status; update lines and header fields
- [ ] `SubmitForApprovalCommand` + handler: transition draft → pending_approval OR draft → approved (auto-approve); fire ApprovalRequested notification if goes to pending_approval
- [ ] `ApprovePurchaseOrderCommand` + handler: requires purchasing.approve; transition pending_approval → approved; emit PurchaseOrderApproved
- [ ] `RejectPurchaseOrderCommand` + handler: requires purchasing.approve; transition pending_approval → draft; record rejection reason
- [ ] `CancelPurchaseOrderCommand` + handler: valid in draft/pending_approval/approved states only; emit PurchaseOrderCancelled
- [ ] `ReceiveGoodsCommand` + handler: requires purchasing.receive; create GoodsReceipt; for each received line emit StockMovementRecorded(inward) to Phase 05 inventory; update PO receivedQuantity; transition PO to partially_received or fully_received based on totals; capture discrepancies
- [ ] `RecordDiscrepancyCommand` + handler: add discrepancy record to goods receipt
- [ ] `RecordSupplierInvoiceCommand` + handler: create SupplierInvoice record; update supplier ledger (Phase 09)
- [ ] `UploadInvoiceForOcrCommand` + handler: accepts file reference, calls OCR stub service, returns extracted data to UI for review and confirmation — does not auto-apply

## API Endpoints

- [ ] `POST /v1/purchase-orders` — create PO
- [ ] `PATCH /v1/purchase-orders/:id` — update (draft only)
- [ ] `GET /v1/purchase-orders` — paginated list with filters: status, supplierId, dateRange
- [ ] `GET /v1/purchase-orders/:id` — full detail with lines and receipts
- [ ] `POST /v1/purchase-orders/:id/submit` — submit for approval
- [ ] `POST /v1/purchase-orders/:id/approve`
- [ ] `POST /v1/purchase-orders/:id/reject` — body: reason string
- [ ] `POST /v1/purchase-orders/:id/cancel` — body: reason string
- [ ] `POST /v1/purchase-orders/:id/receive` — body: lines with received quantities and discrepancy flags
- [ ] `POST /v1/purchase-orders/:id/invoice` — record supplier invoice
- [ ] `POST /v1/purchase-orders/:id/ocr` — upload invoice image, return extracted data (stub)

## Validation (Zod)

- [ ] `CreatePurchaseOrderSchema`: supplierId UUIDv7, branchId UUIDv7, expectedDeliveryDate ISO date, lines array min 1 (productId, quantity, unitPrice)
- [ ] `ReceiveGoodsSchema`: lines array, each with lineId, receivedQuantity, discrepancyType optional, discrepancyNotes optional
- [ ] `RejectPurchaseOrderSchema`: reason string min 10
- [ ] `RecordSupplierInvoiceSchema`: invoiceNumber string, invoiceDate ISO date, totalAmount positive integer, taxAmount nonneg integer

## Permissions

- [ ] Enforce `purchasing.view` on GET endpoints
- [ ] Enforce `purchasing.create` on POST /v1/purchase-orders
- [ ] Enforce `purchasing.edit` on PATCH
- [ ] Enforce `purchasing.approve` on approve and reject endpoints
- [ ] Enforce `purchasing.receive` on receive endpoint
- [ ] Enforce `purchasing.invoice.record` on invoice endpoint

## Sync

- [ ] purchase_orders: Class B field-level HLC merge for header fields
- [ ] goods_receipt_lines: Class A (append-only receipt events, never overwritten)
- [ ] supplier_invoices: Class B

## Desktop UI

- [ ] Purchase Order List page: table with PO number, supplier, date, status badge, total; filterable; "Create PO" button
- [ ] PO Create/Edit form: supplier selector, delivery date, line items (product search, quantity, price)
- [ ] PO Detail page: header info, approval timeline, lines with received progress, receipt history, discrepancy flags, invoice tab
- [ ] Goods Receipt screen: line-by-line quantity entry, discrepancy flag toggle per line, notes field, submit button
- [ ] OCR upload button on PO form: opens file picker, shows mock extracted data panel for user review and manual correction before applying

## Android UI

- [ ] Same screens as Desktop using shared components
- [ ] PO form and receipt screen as scrollable single-column with bottom-sheet selectors

## Tests

- [ ] See TESTS.md
