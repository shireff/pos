# Phase 03 — Products (Catalog) Files

## Database Migrations & Schemas

```
packages/infrastructure/mongodb/migrations/003_products_schema.ts
packages/infrastructure/mongodb/schemas/products.schema.json
packages/infrastructure/mongodb/schemas/product_variants.schema.json
packages/infrastructure/mongodb/schemas/product_units.schema.json
packages/infrastructure/mongodb/schemas/bundle_components.schema.json
packages/infrastructure/mongodb/seeds/default-units.seed.ts
```

## Domain — Catalog

```
packages/domain/catalog/src/entities/index.ts
packages/domain/catalog/src/domain-services/index.ts
packages/domain/catalog/src/domain-services/index.test.ts
packages/domain/catalog/README.md
```

## Application — Catalog Use Cases

```
packages/application/catalog/src/use-cases/create-product.ts
packages/application/catalog/src/use-cases/update-product.ts
packages/application/catalog/src/use-cases/archive-product.ts
packages/application/catalog/src/use-cases/generate-barcode.ts
packages/application/catalog/src/use-cases/configure-bundle.ts
packages/application/catalog/src/use-cases/add-variant.ts
packages/application/catalog/src/use-cases/list-products-query.ts
packages/application/catalog/src/use-cases/get-product-query.ts
```

## Backend API Routes

```
apps/backend/src/app/api/v1/products/route.ts
apps/backend/src/app/api/v1/products/[id]/route.ts
apps/backend/src/app/api/v1/products/[id]/stock/route.ts
apps/backend/src/app/api/v1/products/[id]/barcode/route.ts
apps/backend/src/app/api/v1/products/[id]/variants/route.ts
apps/backend/src/app/api/v1/products/[id]/archive/route.ts
apps/backend/src/lib/catalog-permissions.ts
apps/backend/src/lib/errors.ts
apps/backend/src/lib/sync-product.ts
```

## Shared Schemas & Contracts

```
packages/shared-kernel/src/schemas/index.ts
```

## Shared UI Components

```
packages/ui-components/src/catalog/ProductCard.tsx
packages/ui-components/src/catalog/VariantBadge.tsx
packages/ui-components/src/catalog/UnitSelector.tsx
packages/ui-components/src/catalog/BarcodeDisplay.tsx
packages/ui-components/src/catalog/index.ts
packages/ui-components/src/catalog/catalog-components.test.tsx
```

## Desktop UI

```
apps/desktop/src/features/catalog/ProductListPage.tsx
apps/desktop/src/features/catalog/CatalogPage.tsx
```

## Android UI

```
apps/android/src/features/catalog/ProductListPage.tsx
apps/android/src/features/catalog/CatalogScreen.tsx
```
