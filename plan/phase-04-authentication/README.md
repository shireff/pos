# Phase 04 — Categories & Units

## Purpose

Category tree management and unit of measure library. Provides the taxonomic and measurement foundations that the product catalog (Phase 03) and all downstream modules depend on. Can be built in parallel with Phase 03 but must be complete before Phase 03 exits its own gate, because products reference categories and units by ID.

## Scope

- **Database**: categories collection (tree structure, company-scoped, parent_id nullable for roots), units collection (base unit flag, conversion_factor_to_base)
- **Domain**: Category aggregate with parent-child hierarchy enforcement, UnitOfMeasure entity with conversion factor validation
- **Application**: CreateCategoryCommand, UpdateCategoryCommand, DeleteCategoryCommand, ReorderCategoryCommand, CreateUnitCommand, UpdateUnitCommand use cases
- **API**: GET/POST/PATCH/DELETE /v1/categories, GET/POST/PATCH /v1/units with full Zod validation
- **Permissions**: catalog.view, catalog.create, catalog.edit, catalog.delete — enforced at Application layer
- **Sync**: Class B field-level HLC merge for both categories and units
- **Desktop UI**: Category tree browser (drag-and-drop reorder, inline rename, nested add), Unit picker modal with conversion preview
- **Android UI**: same screens using shared components (collapsible tree list on mobile)
- **Shared Components**: CategoryTreeNode, CategoryBreadcrumb, UnitConversionBadge
- **Tests**: tree integrity (no circular parents), unit conversion round-trips, permission enforcement on all endpoints

## Expected Output

A working category tree and unit library where:

- Categories can be created, nested, renamed, reordered, and soft-deleted
- Circular parent references are rejected at the domain layer
- Units have correct base-unit flags and conversion factors
- Both Desktop and Android show the same tree state after sync

## Documents Referenced

- Database.md §2.6
- PRD.md §4.3

## Included Modules

- `packages/domain/catalog/src/aggregates/category.aggregate.ts`
- `packages/domain/catalog/src/entities/unit-of-measure.entity.ts`
- `packages/application/catalog/src/categories/*`
- `packages/application/catalog/src/units/*`
- `packages/infrastructure/mongodb/migrations/004_categories_units_schema.ts`
- `packages/infrastructure/mongodb/repositories/category.repository.ts`
- `packages/infrastructure/mongodb/repositories/unit.repository.ts`
- `apps/backend/src/http/categories/*`
- `apps/backend/src/http/units/*`
- `packages/ui-components/src/categories/*`
- `apps/desktop/src/features/categories/*`
- `apps/android/src/features/categories/*`
