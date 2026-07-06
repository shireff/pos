# Phase 06 — Purchases Dependencies

## Incoming

- Phase 01, 02 (Foundation, Auth)
- Phase 03 (Products) — PO lines reference product variants
- Phase 05 (Inventory) — goods receipt creates PURCHASE_RECEIPT stock movement events
- Phase 09 (Suppliers) — POs reference suppliers; can run in parallel with Phase 09 if Supplier stub is created first

## Outgoing

- Phase 09 (Suppliers) — supplier performance metrics require PO history
- Phase 13 (Reports) — Purchases report and Supplier Performance report consume PO data
- Phase 15 (AI Services) — AI supplier suggestions use PO price history

## Documents Used

- PRD.md §4.5 (FR-5.1, FR-5.2)
- Database.md §2.12 (purchase_orders, purchase_order_lines, supplier_invoices)
- API.md §4.4 (purchasing endpoints)
- Business_Rules.md §7 (BR-SUP-001 through BR-SUP-005)
- State_Machines.md §4 (Purchase Order lifecycle)
- Event_Catalog.md §5 (PurchaseOrder* events, SupplierInvoiceOCR* events)
- Notifications.md §3 (PO pending approval trigger)

## Shared Modules Produced

- `packages/domain/purchasing` — PurchaseOrder, SupplierInvoice aggregates
- `packages/application/purchasing` — PO lifecycle use cases
- `packages/ui-components/src/purchasing/*` — PO Builder, OCR Import screens
