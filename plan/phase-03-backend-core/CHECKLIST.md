# Phase 03 — Products (Catalog) Checklist

A phase is **NOT complete** until every item below is checked.

## Database

- [x] Migration `003_products_schema.ts` applies cleanly on fresh DB
- [x] JSON Schema validators reject invalid documents at DB level
- [x] All indexes in place (companyId+sku unique, companyId+barcode unique)

## Domain

- [x] Product aggregate, Variant, Category, UnitOfMeasure, Bundle, Barcode all implemented with full types
- [x] Unit conversion math returns exact integer piaster arithmetic — no floating-point values
- [x] Bundle component deduction ratio logic tested and correct
- [x] EAN-13 checksum validation rejects invalid barcodes
- [x] Code128 character set validation rejects invalid characters
- [x] Auto-barcode generation produces valid EAN-13 with correct check digit

## Application

- [x] All 6 commands (Create, Update, Archive, GenerateBarcode, ConfigureBundle, AddVariant) have handlers with tests
- [ ] ArchiveProductCommand rejects archiving if open PO lines reference product
- [ ] All permission codes enforced at Application layer (not just middleware)

## API

- [x] GET /v1/products supports filter + sort + pagination
- [x] POST /v1/products creates product with variants and bundle config in one request
- [x] PATCH /v1/products/:id enforces catalog.price.edit when price fields are changed
- [x] GET /v1/products/:id/stock reads stock details by warehouse from the product routes
- [x] All Zod schemas validate request bodies before handler is invoked
- [x] 403 responses include a specific permissionCode field

## Sync

- [x] Products are emitted through the sync outbox for create/update/archive events
- [x] Price field concurrent edits are handled through the sync conflict path

## Desktop UI

- [x] Product List page renders with filter, sort, and pagination working
- [x] Empty state shows a clear add-product CTA
- [x] Product Detail/Edit page shows the main catalog tabs correctly
- [x] Stock-level color coding is implemented in the list view

## Android UI

- [x] Product List renders as a card-based list on Android
- [x] Product Detail renders as a scrollable single-column experience
- [x] No Kotlin/Java code was introduced for the product implementation

## Shared Components

- [x] ProductCard, VariantBadge, UnitSelector, BarcodeDisplay are implemented and exported from `packages/ui-components/src/catalog`

## Tests

- [x] Unit conversion math test suite passes (all cases including carton→piece, kg→gram)
- [x] Bundle ratio validation tests pass
- [x] Barcode checksum tests pass for EAN-13 and Code128
- [ ] Integration tests: full CRUD lifecycle with permission enforcement
- [ ] E2E: product created on Desktop appears on Android after sync

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
- [ ] No placeholder implementations
