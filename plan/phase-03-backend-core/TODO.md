# Phase 03 — Products (Catalog) TODO

## Current update — 2026-07-07

- [x] Catalog UI work for desktop and Android has been implemented with interactive add/edit product flows and barcode actions.
- [x] Shared catalog components are available and used by both surfaces.
- [x] The current implementation is state-driven in the UI layer; the next milestone is wiring these screens to the real backend/API persistence flow.

## Database

- [x] Create MongoDB migration `003_products_schema.ts`: products, product_variants, product_units, bundle_components collections with full JSON Schema validators and compound indexes (companyId+sku, companyId+barcode)
- [x] Add products.status enum constraint: active, archived
- [x] Add product_variants foreign key index to products._id
- [x] Add bundle_components foreign key index to products._id for both parent and component

## Domain — Catalog

- [x] Implement `Product` aggregate: id (UUIDv7), companyId, name (multi-language: ar/en), sku, categoryId, unitId, costPrice (Money), sellingPrice (Money), status, createdAt, updatedAt
- [x] Implement `Variant` entity: id, productId, name, sku, barcode, additionalPrice (Money delta), attributes (key-value map)
- [x] Implement `Category` entity: id, companyId, name (ar/en), parentId (nullable), sortOrder
- [x] Implement `UnitOfMeasure` entity: id, companyId, name (ar/en), abbreviation, isBaseUnit, conversionFactorToBase
- [x] Implement `Bundle` entity: id, productId, components (array of {componentProductId, quantity, deductionRatio})
- [x] Implement `Barcode` value object: value, type (EAN-13/Code128/QR/custom), validate EAN-13 checksum, validate Code128 character set
- [x] Implement unit conversion math: `convertQuantity(qty, fromUnit, toUnit, conversionFactors)` — returns exact Money arithmetic result, never float
- [x] Implement bundle component deduction: `calculateComponentDeductions(bundleQty, components)` — proportional to deductionRatio, rounded down for each component
- [x] Implement barcode validation for EAN-13 and Code128 character sets
- [x] Implement auto-barcode generation: EAN-13 with company prefix, sequential suffix, correct check digit
- [x] Write domain README for `packages/domain/catalog`

## Application — Use Cases

- [x] `CreateProductUseCase` implemented for product creation with category validation and persistence
- [x] `UpdateProductUseCase` implemented for product updates with category validation and persistence
- [x] `ArchiveProductUseCase` implemented for product archiving with persistence
- [x] `GenerateBarcodeUseCase` implemented for EAN-13 barcode generation and persistence
- [x] `ConfigureBundleUseCase` implemented for bundle configuration with component validation and persistence
- [x] `AddVariantCommand` + handler: validate variant SKU uniqueness, validate barcode if provided, emit VariantAdded event
- [x] `GetProductQuery` + handler: fetch with variants, units, and bundle components joined
- [x] `ListProductsQuery` + handler: paginated, filterable by category/status/search term, sortable by name/price/stock

## API Endpoints

- [x] `GET /v1/products` — paginated list with filters: categoryId, status, search; sortBy: name, price, createdAt
- [x] `POST /v1/products` — create product with optional variants and bundle config
- [x] `PATCH /v1/products/:id` — partial update (field-level); price changes checked against approval threshold
- [x] `GET /v1/products/:id` — full detail with variants, units, bundle components, stock summary
- [x] `GET /v1/products/:id/stock` — stock levels by warehouse (reads from Phase 05 stock_items read-model)
- [x] `POST /v1/products/:id/barcode` — generate barcode for product or variant
- [x] `POST /v1/products/:id/variants` — add variant
- [x] `PATCH /v1/products/:id/archive` — archive product

## Validation (Zod)

- [x] `CreateProductSchema`: name object (ar required, en optional), sku string, categoryId UUIDv7, unitId UUIDv7, costPrice number (positive integer piasters), sellingPrice number (positive integer piasters), status optional default active
- [x] `UpdateProductSchema`: all fields optional, at least one required
- [x] `AddVariantSchema`: name object, sku string, barcode optional, additionalPrice integer, attributes record
- [x] `ConfigureBundleSchema`: components array min 1, each with componentProductId UUIDv7, quantity positive, deductionRatio 0–1
- [x] `GenerateBarcodeSchema`: variantId optional UUIDv7, barcodeType enum(EAN-13/Code128)

## Permissions

- [x] Enforce `catalog.view` on all GET endpoints via requirePermission middleware
- [x] Enforce `catalog.create` on POST /v1/products and POST /v1/products/:id/variants
- [x] Enforce `catalog.edit` on PATCH /v1/products/:id
- [x] Enforce `catalog.delete` on PATCH /v1/products/:id/archive
- [x] Enforce `catalog.price.edit` on PATCH /v1/products/:id when sellingPrice or costPrice are in body
- [x] Enforce `catalog.barcode.generate` on POST /v1/products/:id/barcode
- [x] Enforce `catalog.bundle.configure` on bundle configuration endpoints
- [x] 403 response always includes specific permissionCode field

## Sync

- [x] Mark products collection as Class B sync (field-level HLC merge)
- [x] Tag price fields (sellingPrice, costPrice) with hlcTimestamp for conflict detection
- [x] Add products to outbox emission on Create, Update, Archive events
- [x] Price field conflict (concurrent edits from two devices) creates sync_conflict record for manual review

## Desktop UI

- [x] Product List page (`apps/desktop/src/features/catalog/ProductListPage.tsx`): sortable/filterable table, columns: name, SKU, category, unit, selling price, stock (color-coded), status; pagination; "Add Product" button; empty state with CTA
- [x] Product Detail/Edit page with tabs: General Info, Variants, Units & Conversion, Batches/Expiry, Pricing History, Stock by Warehouse
- [x] Product Create/Edit form: name fields (ar/en), category selector, unit selector, price inputs, barcode input/generate; implemented as interactive local-state forms in desktop and Android screens
- [x] Variants tab: variant list, add variant form inline
- [x] Units & Conversion tab: base unit display, conversion factor list
- [x] Barcode display with print option in product detail header; desktop and Android now also expose copy/print actions from the shared component

## Android UI

- [x] Product List page (`apps/android/src/features/catalog/ProductListPage.tsx`): card-based list using ProductCard component, same filters as desktop via bottom-sheet
- [x] Product Detail page: same tabs, scrollable single column
- [x] All screens use shared components from `packages/ui-components/src/catalog`

## Shared Components

- [x] `ProductCard.tsx`: product name (ar+en), SKU, price, stock level indicator
- [x] `VariantBadge.tsx`: variant name + key attribute pills
- [x] `UnitSelector.tsx`: unit dropdown with conversion preview
- [x] `BarcodeDisplay.tsx`: renders barcode image (SVG), copy-to-clipboard, print trigger

## Tests

- [x] Added catalog component regression tests in `packages/ui-components/src/catalog/catalog-components.test.tsx`

## Documentation

- [x] `packages/domain/catalog/README.md` — documents aggregate contracts
- [x] Added basic catalog UI documentation comments in the new screen and component files
- [x] Update API.md if any endpoint contract was refined during implementation
