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
packages/domain/catalog/src/aggregates/product.aggregate.ts
packages/domain/catalog/src/aggregates/product.aggregate.test.ts
packages/domain/catalog/src/entities/variant.entity.ts
packages/domain/catalog/src/entities/unit-of-measure.entity.ts
packages/domain/catalog/src/entities/bundle.entity.ts
packages/domain/catalog/src/value-objects/barcode.vo.ts
packages/domain/catalog/src/value-objects/barcode.vo.test.ts
packages/domain/catalog/src/domain-services/unit-conversion.service.ts
packages/domain/catalog/src/domain-services/unit-conversion.service.test.ts
packages/domain/catalog/src/domain-services/bundle-deduction.service.ts
packages/domain/catalog/src/domain-services/bundle-deduction.service.test.ts
packages/domain/catalog/src/domain-services/barcode-generator.service.ts
packages/domain/catalog/src/domain-services/barcode-generator.service.test.ts
packages/domain/catalog/src/domain-events/product-created.event.ts
packages/domain/catalog/src/domain-events/product-updated.event.ts
packages/domain/catalog/src/domain-events/product-archived.event.ts
packages/domain/catalog/src/domain-events/barcode-generated.event.ts
packages/domain/catalog/src/domain-events/variant-added.event.ts
packages/domain/catalog/README.md
packages/domain/catalog/src/index.ts
```

## Application — Catalog Use Cases

```
packages/application/catalog/src/create-product/create-product.command.ts
packages/application/catalog/src/create-product/create-product.handler.ts
packages/application/catalog/src/create-product/create-product.handler.test.ts
packages/application/catalog/src/update-product/update-product.command.ts
packages/application/catalog/src/update-product/update-product.handler.ts
packages/application/catalog/src/archive-product/archive-product.command.ts
packages/application/catalog/src/archive-product/archive-product.handler.ts
packages/application/catalog/src/archive-product/archive-product.handler.test.ts
packages/application/catalog/src/generate-barcode/generate-barcode.command.ts
packages/application/catalog/src/generate-barcode/generate-barcode.handler.ts
packages/application/catalog/src/configure-bundle/configure-bundle.command.ts
packages/application/catalog/src/configure-bundle/configure-bundle.handler.ts
packages/application/catalog/src/configure-bundle/configure-bundle.handler.test.ts
packages/application/catalog/src/add-variant/add-variant.command.ts
packages/application/catalog/src/add-variant/add-variant.handler.ts
packages/application/catalog/src/get-product/get-product.query.ts
packages/application/catalog/src/get-product/get-product.handler.ts
packages/application/catalog/src/list-products/list-products.query.ts
packages/application/catalog/src/list-products/list-products.handler.ts
packages/application/catalog/src/index.ts
```

## Infrastructure — Repositories

```
packages/infrastructure/mongodb/repositories/product.repository.ts
packages/infrastructure/mongodb/repositories/product.repository.test.ts
packages/infrastructure/mongodb/repositories/variant.repository.ts
packages/infrastructure/mongodb/repositories/bundle.repository.ts
```

## API (Backend)

```
apps/backend/src/http/products/products.controller.ts
apps/backend/src/http/products/products.controller.test.ts
apps/backend/src/http/products/products.schemas.ts
```

## Shared UI Components

```
packages/ui-components/src/catalog/ProductCard.tsx
packages/ui-components/src/catalog/ProductCard.test.tsx
packages/ui-components/src/catalog/VariantBadge.tsx
packages/ui-components/src/catalog/UnitSelector.tsx
packages/ui-components/src/catalog/BarcodeDisplay.tsx
packages/ui-components/src/catalog/index.ts
```

## Desktop UI

```
apps/desktop/src/features/catalog/ProductListPage.tsx
apps/desktop/src/features/catalog/ProductDetailPage.tsx
apps/desktop/src/features/catalog/ProductFormPage.tsx
apps/desktop/src/features/catalog/tabs/GeneralInfoTab.tsx
apps/desktop/src/features/catalog/tabs/VariantsTab.tsx
apps/desktop/src/features/catalog/tabs/UnitsConversionTab.tsx
apps/desktop/src/features/catalog/tabs/BatchesExpiryTab.tsx
apps/desktop/src/features/catalog/tabs/PricingHistoryTab.tsx
apps/desktop/src/features/catalog/tabs/StockByWarehouseTab.tsx
```

## Android UI

```
apps/android/src/features/catalog/ProductListPage.tsx
apps/android/src/features/catalog/ProductDetailPage.tsx
apps/android/src/features/catalog/ProductFormPage.tsx
```

## State Management

```
packages/ui-components/src/stores/catalog.store.ts
```
