# Phase 03 — Products Dependencies

## Incoming

- Phase 01 (Foundation) — MongoDB connection, shared-kernel, app shells
- Phase 02 (Authentication & Licensing) — auth middleware, permission enforcement, subscription guard

## Outgoing (blocked until Phase 03 exits)

- Phase 05 (Inventory) — stock movements reference product variants
- Phase 06 (Purchases) — purchase order lines reference products
- Phase 07 (Sales) — order lines reference product variants and barcodes
- Phase 11 (Discounts & Taxes) — discount rules scope to categories and products
- Phase 13 (Reports) — product data feeds inventory valuation and best/worst seller reports

## Documents Used

- Database.md §2.6 (products, variants, units, bundles)
- API.md §4.1 (catalog endpoints)
- PRD.md §4.3 (FR-3.1 through FR-3.8)
- Business_Rules.md §5 (BR-PRC-001 through BR-PRC-006)
- UI_UX.md §2.2 (Product List and Detail screens)
- Design_System.md §6 (tables, cards, inputs)
- Sync_Architecture.md §3.2 (Class B field-level merge for products)
- Event_Catalog.md §3 (ProductCreated, ProductUpdated, ProductArchived)
- Coding_Standards.md §4 (naming conventions)
- Error_Catalog.md §5 (BUSINESS_RULE_VIOLATION, VALIDATION_ERROR)

## Shared Modules Produced

- `packages/domain/catalog` — Product, Variant, Category, UnitOfMeasure, Bundle aggregates/entities
- `packages/application/catalog` — all catalog use-case handlers
- `packages/infrastructure/mongodb/repositories/product.repository.ts`
- `packages/ui-components/src/catalog/*` — ProductCard, VariantBadge, UnitSelector, BarcodeDisplay
- `apps/backend/src/http/catalog/` — REST endpoints consumed by all subsequent phases
