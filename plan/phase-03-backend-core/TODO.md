# Phase 03 — Products (Catalog) TODO

## Database

- [ ] Create MongoDB migration `003_products_schema.ts`: products, product_variants, product_units, bundle_components collections with full JSON Schema validators and compound indexes (companyId+sku, companyId+barcode)
- [ ] Add products.status enum constraint: active, archived
- [ ] Add product_variants foreign key index to products._id
- [ ] Add bundle_components foreign key index to products._id for both parent and component

## Domain — Catalog

- [ ] Implement `Product` aggregate: id (UUIDv7), companyId, name (multi-language: ar/en), sku, categoryId, unitId, costPrice (Money), sellingPrice (Money), status, createdAt, updatedAt
- [ ] Implement `Variant` entity: id, productId, name, sku, barcode, additionalPrice (Money delta), attributes (key-value map)
- [ ] Implement `Category` entity: id, companyId, name (ar/en), parentId (nullable), sortOrder
- [ ] Implement `UnitOfMeasure` entity: id, companyId, name (ar/en), abbreviation, isBaseUnit, conversionFactorToBase
- [ ] Implement `Bundle` entity: id, productId, components (array of {componentProductId, quantity, deductionRatio})
- [ ] Implement `Barcode` value object: value, type (EAN-13/Code128/QR/custom), validate EAN-13 checksum, validate Code128 character set
- [ ] Implement unit conversion math: `convertQuantity(qty, fromUnit, toUnit, conversionFactors)` — returns exact Money arithmetic result, never float
- [ ] Implement bundle component deduction: `calculateComponentDeductions(bundleQty, components)` — proportional to deductionRatio, rounded down for each component
- [ ] Implement auto-barcode generation: EAN-13 with company prefix, sequential suffix, correct check digit
- [ ] Write domain README for `packages/domain/catalog`

## Application — Use Cases

- [ ] `CreateProductCommand` + handler: validate name/sku uniqueness within company, emit ProductCreated event
- [ ] `UpdateProductCommand` + handler: field-level HLC update, validate sku uniqueness if changed, emit ProductUpdated event
- [ ] `ArchiveProductCommand` + handler: check no open purchase order lines reference this product, set status=archived
- [ ] `GenerateBarcodeCommand` + handler: generate EAN-13, persist to product/variant, emit BarcodeGenerated event
- [ ] `ConfigureBundleCommand` + handler: validate all component product IDs exist, validate deductionRatio sum, persist bundle configuration
- [ ] `AddVariantCommand` + handler: validate variant SKU uniqueness, validate barcode if provided, emit VariantAdded event
- [ ] `GetProductQuery` + handler: fetch with variants, units, and bundle components joined
- [ ] `ListProductsQuery` + handler: paginated, filterable by category/status/search term, sortable by name/price/stock

## API Endpoints

- [ ] `GET /v1/products` — paginated list with filters: categoryId, status, search; sortBy: name, price, createdAt
- [ ] `POST /v1/products` — create product with optional variants and bundle config
- [ ] `PATCH /v1/products/:id` — partial update (field-level); price changes checked against approval threshold
- [ ] `GET /v1/products/:id` — full detail with variants, units, bundle components, stock summary
- [ ] `GET /v1/products/:id/stock` — stock levels by warehouse (reads from Phase 05 stock_items read-model)
- [ ] `POST /v1/products/:id/barcode` — generate barcode for product or variant
- [ ] `POST /v1/products/:id/variants` — add variant
- [ ] `PATCH /v1/products/:id/archive` — archive product

## Validation (Zod)

- [ ] `CreateProductSchema`: name object (ar required, en optional), sku string, categoryId UUIDv7, unitId UUIDv7, costPrice number (positive integer piasters), sellingPrice number (positive integer piasters), status optional default active
- [ ] `UpdateProductSchema`: all fields optional, at least one required
- [ ] `AddVariantSchema`: name object, sku string, barcode optional, additionalPrice integer, attributes record
- [ ] `ConfigureBundleSchema`: components array min 1, each with componentProductId UUIDv7, quantity positive, deductionRatio 0–1
- [ ] `GenerateBarcodeSchema`: variantId optional UUIDv7, barcodeType enum(EAN-13/Code128)

## Permissions

- [ ] Enforce `catalog.view` on all GET endpoints via requirePermission middleware
- [ ] Enforce `catalog.create` on POST /v1/products and POST /v1/products/:id/variants
- [ ] Enforce `catalog.edit` on PATCH /v1/products/:id
- [ ] Enforce `catalog.delete` on PATCH /v1/products/:id/archive
- [ ] Enforce `catalog.price.edit` on PATCH /v1/products/:id when sellingPrice or costPrice are in body
- [ ] Enforce `catalog.barcode.generate` on POST /v1/products/:id/barcode
- [ ] Enforce `catalog.bundle.configure` on bundle configuration endpoints
- [ ] 403 response always includes specific permissionCode field

## Sync

- [ ] Mark products collection as Class B sync (field-level HLC merge)
- [ ] Tag price fields (sellingPrice, costPrice) with hlcTimestamp for conflict detection
- [ ] Add products to outbox emission on Create, Update, Archive events
- [ ] Price field conflict (concurrent edits from two devices) creates sync_conflict record for manual review

## Desktop UI

- [ ] Product List page (`apps/desktop/src/features/catalog/ProductListPage.tsx`): sortable/filterable table, columns: name, SKU, category, unit, selling price, stock (color-coded), status; pagination; "Add Product" button; empty state with CTA
- [ ] Product Detail/Edit page with tabs: General Info, Variants, Units & Conversion, Batches/Expiry, Pricing History, Stock by Warehouse
- [ ] Product Create/Edit form: name fields (ar/en), category selector, unit selector, price inputs, barcode input/generate
- [ ] Variants tab: variant list, add variant form inline
- [ ] Units & Conversion tab: base unit display, conversion factor list
- [ ] Barcode display with print option in product detail header

## Android UI

- [ ] Product List page (`apps/android/src/features/catalog/ProductListPage.tsx`): card-based list using ProductCard component, same filters as desktop via bottom-sheet
- [ ] Product Detail page: same tabs, scrollable single column
- [ ] All screens use shared components from `packages/ui-components/src/catalog`

## Shared Components

- [ ] `ProductCard.tsx`: product name (ar+en), SKU, price, stock level indicator
- [ ] `VariantBadge.tsx`: variant name + key attribute pills
- [ ] `UnitSelector.tsx`: unit dropdown with conversion preview
- [ ] `BarcodeDisplay.tsx`: renders barcode image (SVG), copy-to-clipboard, print trigger

## Tests

- [ ] See TESTS.md

## Documentation

- [ ] `packages/domain/catalog/README.md` — documents aggregate contracts
- [ ] JSDoc on all exported domain aggregate methods
- [ ] Update API.md if any endpoint contract was refined during implementation
