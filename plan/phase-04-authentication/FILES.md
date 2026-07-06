# Phase 04 — Categories & Units Files

## Database Migrations & Schemas

```
packages/infrastructure/mongodb/migrations/004_categories_units_schema.ts
packages/infrastructure/mongodb/schemas/categories.schema.json
packages/infrastructure/mongodb/schemas/units.schema.json
packages/infrastructure/mongodb/seeds/default-categories.seed.ts
```

## Domain — Catalog (Categories & Units)

```
packages/domain/catalog/src/aggregates/category.aggregate.ts
packages/domain/catalog/src/aggregates/category.aggregate.test.ts
packages/domain/catalog/src/entities/unit-of-measure.entity.ts
packages/domain/catalog/src/entities/unit-of-measure.entity.test.ts
packages/domain/catalog/src/domain-services/category-tree.service.ts
packages/domain/catalog/src/domain-services/category-tree.service.test.ts
packages/domain/catalog/src/domain-events/category-created.event.ts
packages/domain/catalog/src/domain-events/category-updated.event.ts
packages/domain/catalog/src/domain-events/category-deleted.event.ts
packages/domain/catalog/src/domain-events/category-reordered.event.ts
packages/domain/catalog/src/domain-events/unit-created.event.ts
packages/domain/catalog/src/domain-events/unit-updated.event.ts
```

## Application — Category & Unit Use Cases

```
packages/application/catalog/src/create-category/create-category.command.ts
packages/application/catalog/src/create-category/create-category.handler.ts
packages/application/catalog/src/create-category/create-category.handler.test.ts
packages/application/catalog/src/update-category/update-category.command.ts
packages/application/catalog/src/update-category/update-category.handler.ts
packages/application/catalog/src/delete-category/delete-category.command.ts
packages/application/catalog/src/delete-category/delete-category.handler.ts
packages/application/catalog/src/delete-category/delete-category.handler.test.ts
packages/application/catalog/src/reorder-category/reorder-category.command.ts
packages/application/catalog/src/reorder-category/reorder-category.handler.ts
packages/application/catalog/src/reorder-category/reorder-category.handler.test.ts
packages/application/catalog/src/get-category-tree/get-category-tree.query.ts
packages/application/catalog/src/get-category-tree/get-category-tree.handler.ts
packages/application/catalog/src/create-unit/create-unit.command.ts
packages/application/catalog/src/create-unit/create-unit.handler.ts
packages/application/catalog/src/update-unit/update-unit.command.ts
packages/application/catalog/src/update-unit/update-unit.handler.ts
```

## Infrastructure — Repositories

```
packages/infrastructure/mongodb/repositories/category.repository.ts
packages/infrastructure/mongodb/repositories/category.repository.test.ts
packages/infrastructure/mongodb/repositories/unit.repository.ts
```

## API (Backend)

```
apps/backend/src/http/categories/categories.controller.ts
apps/backend/src/http/categories/categories.controller.test.ts
apps/backend/src/http/categories/categories.schemas.ts
apps/backend/src/http/units/units.controller.ts
apps/backend/src/http/units/units.controller.test.ts
apps/backend/src/http/units/units.schemas.ts
```

## Shared UI Components

```
packages/ui-components/src/categories/CategoryTreeNode.tsx
packages/ui-components/src/categories/CategoryBreadcrumb.tsx
packages/ui-components/src/categories/UnitConversionBadge.tsx
packages/ui-components/src/categories/UnitPickerModal.tsx
packages/ui-components/src/categories/index.ts
```

## Desktop UI

```
apps/desktop/src/features/categories/CategoryTreePage.tsx
apps/desktop/src/features/categories/CategoryTreePage.test.tsx
apps/desktop/src/features/units/UnitListPage.tsx
```

## Android UI

```
apps/android/src/features/categories/CategoryTreePage.tsx
apps/android/src/features/units/UnitListPage.tsx
```
