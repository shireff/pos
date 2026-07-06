# Phase 03 — Products (Catalog)

## Purpose

Full product catalog management delivered as a single vertical slice: products, product variants, categories, units of measure, bundle components, and barcodes. Every layer is implemented together — database through domain through application through API through UI through sync.

## Scope

- **Database**: products, product_variants, product_units, bundle_components, categories collections with full JSON Schema validators and indexes
- **Domain**: Product aggregate, Variant entity, Category entity, UnitOfMeasure entity, Bundle entity, Barcode value object — all in `packages/domain/catalog`
- **Business Logic**: unit conversion math (conversion_factor_to_base), bundle component stock deduction ratio, barcode checksum validation (EAN-13, Code128), auto-barcode generation
- **Application**: CreateProductCommand, UpdateProductCommand, ArchiveProductCommand, GenerateBarcodeCommand, ConfigureBundleCommand, AddVariantCommand use cases
- **API**: GET/POST/PATCH /v1/products, GET /v1/products/:id/stock, POST /v1/products/:id/barcode with full Zod validation
- **Permissions**: catalog.view, catalog.create, catalog.edit, catalog.delete, catalog.price.edit, catalog.barcode.generate, catalog.bundle.configure, catalog.unit_conversion.edit — all enforced at Application layer
- **Sync**: products sync as Class B (field-level HLC merge); price field flagged for stricter conflict review
- **Desktop UI**: Product List screen (filterable/sortable table, stock-level color coding), Product Detail/Edit screen (tabs: General Info, Variants, Units & Conversion, Batches/Expiry, Pricing History, Stock by Warehouse), Empty state with "Add your first product" CTA
- **Android UI**: same screens using shared components (card list for mobile)
- **Shared Components**: ProductCard, VariantBadge, UnitSelector, BarcodeDisplay
- **Tests**: unit conversion math, bundle ratio validation, barcode checksum tests, integration CRUD + permission enforcement, E2E Desktop→Android sync

## Expected Output

A fully working product catalog where:

- Products with variants, units of measure, bundle definitions, and barcodes can be created, read, updated, and archived
- Unit conversion math is accurate across all conversion_factor_to_base calculations
- Bundle stock deduction correctly pro-rates components
- EAN-13 and Code128 barcode checksums are validated and auto-generation produces valid codes
- All catalog permission codes are enforced — missing permissions return 403 with the specific permissionCode
- A product created on Desktop is visible on Android after sync

## Documents Referenced

- Database.md §2.6
- API.md §4.1
- PRD.md §4.3
- Business_Rules.md §5
- UI_UX.md §2.2
- Design_System.md

## Included Modules

- `packages/domain/catalog` — full implementation (Product, Variant, Category, UnitOfMeasure, Bundle, Barcode)
- `packages/application/catalog` — all command and query handlers
- `packages/infrastructure/mongodb/repositories/product.repository.ts`
- `packages/infrastructure/mongodb/migrations/003_products_schema.ts`
- `apps/backend/src/http/products/*`
- `packages/ui-components/src/catalog/*` (ProductCard, VariantBadge, UnitSelector, BarcodeDisplay)
- `apps/desktop/src/features/catalog/*`
- `apps/android/src/features/catalog/*`
