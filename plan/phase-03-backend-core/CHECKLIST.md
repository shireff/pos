# Phase 03 — Products (Catalog) Checklist

A phase is **NOT complete** until every item below is checked.

## Database

- [ ] Migration `003_products_schema.ts` applies cleanly on fresh DB
- [ ] JSON Schema validators reject invalid documents at DB level
- [ ] All indexes in place (companyId+sku unique, companyId+barcode unique)

## Domain

- [ ] Product aggregate, Variant, Category, UnitOfMeasure, Bundle, Barcode all implemented with full types
- [ ] Unit conversion math returns exact integer piaster arithmetic — no floating-point values
- [ ] Bundle component deduction ratio logic tested and correct
- [ ] EAN-13 checksum validation rejects invalid barcodes
- [ ] Code128 character set validation rejects invalid characters
- [ ] Auto-barcode generation produces valid EAN-13 with correct check digit

## Application

- [ ] All 6 commands (Create, Update, Archive, GenerateBarcode, ConfigureBundle, AddVariant) have handlers with tests
- [ ] ArchiveProductCommand rejects archiving if open PO lines reference product
- [ ] All permission codes enforced at Application layer (not just middleware)

## API

- [ ] GET /v1/products supports filter + sort + pagination
- [ ] POST /v1/products creates product with variants and bundle config in one request
- [ ] PATCH /v1/products/:id enforces catalog.price.edit when price fields are changed
- [ ] GET /v1/products/:id/stock reads from Phase 05 read-model (or returns empty if Phase 05 not yet applied)
- [ ] All Zod schemas validate request bodies before handler is invoked
- [ ] 403 responses always include specific permissionCode

## Sync

- [ ] Products are in sync outbox after every Create/Update/Archive
- [ ] Price field concurrent edits create a sync_conflict record (not silently overwritten)

## Desktop UI

- [ ] Product List page renders with filter, sort, and pagination working
- [ ] Empty state shows "Add your first product" CTA
- [ ] Product Detail/Edit page shows all 6 tabs correctly
- [ ] Stock-level color coding is correct (green/amber/red)

## Android UI

- [ ] Product List renders as card list on Android
- [ ] Product Detail renders as single-column scrollable tabs
- [ ] No Kotlin/Java code in Android product implementation

## Shared Components

- [ ] ProductCard, VariantBadge, UnitSelector, BarcodeDisplay all exported from `packages/ui-components/src/catalog`

## Tests

- [ ] Unit conversion math test suite passes (all cases including carton→piece, kg→gram)
- [ ] Bundle ratio validation tests pass
- [ ] Barcode checksum tests pass for EAN-13 and Code128
- [ ] Integration tests: full CRUD lifecycle with permission enforcement
- [ ] E2E: product created on Desktop appears on Android after sync

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
- [ ] No placeholder implementations
