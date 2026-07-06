# Phase 06 — Purchases

## Purpose

Full purchase order lifecycle — supplier selection, PO creation with line items, multi-step approval workflow, goods receipt with discrepancy capture, supplier invoice recording, and an OCR upload stub (returns structured mock data until Phase 15 wires the real AI OCR). Drives inventory inward stock movements via Phase 05.

## Scope

- **Database**: purchase_orders, purchase_order_lines, goods_receipts, goods_receipt_lines, supplier_invoices collections with full JSON Schema validators
- **Domain**: PurchaseOrder aggregate with state machine (draft → pending_approval → approved → partially_received → fully_received → cancelled), GoodsReceipt aggregate, SupplierInvoice entity, Discrepancy value object
- **Business Logic**: PO approval threshold (auto-approve below configurable limit, require approval above), goods receipt discrepancy capture (quantity variance, quality rejection), supplier invoice three-way match stub, OCR upload stub (returns deterministic mock until Phase 15), approval notification trigger
- **Application**: CreatePurchaseOrderCommand, UpdatePurchaseOrderCommand, SubmitForApprovalCommand, ApprovePurchaseOrderCommand, RejectPurchaseOrderCommand, CancelPurchaseOrderCommand, ReceiveGoodsCommand, RecordDiscrepancyCommand, RecordSupplierInvoiceCommand, UploadInvoiceForOcrCommand (stub)
- **API**: POST /v1/purchase-orders, PATCH /v1/purchase-orders/:id, POST /v1/purchase-orders/:id/submit, POST /v1/purchase-orders/:id/approve, POST /v1/purchase-orders/:id/reject, POST /v1/purchase-orders/:id/cancel, POST /v1/purchase-orders/:id/receive, GET /v1/purchase-orders, GET /v1/purchase-orders/:id
- **Permissions**: purchasing.view, purchasing.create, purchasing.edit, purchasing.approve, purchasing.receive, purchasing.invoice.record
- **Sync**: Class B field-level HLC merge for PO header fields; receipt events are Class A (append-only)
- **Desktop UI**: Purchase Order List (filterable by status/supplier/date), PO Create/Edit form, PO Detail with approval timeline, Goods Receipt screen (line-by-line quantity entry with discrepancy flags), OCR upload button (stub — shows mock extracted data)
- **Android UI**: same screens using shared components
- **Integration with Phase 05**: ReceiveGoodsCommand emits StockMovementRecorded events for every received line

## Expected Output

A working purchase workflow where:

- A PO moves through the complete draft→approved→received state machine
- Goods receipt triggers inventory inward stock movement events
- Discrepancies are captured and visible on the PO detail screen
- The OCR stub accepts a file upload and returns deterministic mock extracted data
- All approval permission checks are enforced (non-approvers cannot approve)

## Documents Referenced

- PRD.md §4.5
- Database.md §2.12
- API.md §4.4
- Business_Rules.md §7
- State_Machines.md §4

## Included Modules

- `packages/domain/purchasing` — full implementation
- `packages/application/purchasing` — all command and query handlers
- `packages/infrastructure/mongodb/migrations/006_purchases_schema.ts`
- `packages/infrastructure/mongodb/repositories/purchase-order.repository.ts`
- `packages/infrastructure/mongodb/repositories/goods-receipt.repository.ts`
- `apps/backend/src/http/purchases/*`
- `packages/ui-components/src/purchases/*`
- `apps/desktop/src/features/purchases/*`
- `apps/android/src/features/purchases/*`
