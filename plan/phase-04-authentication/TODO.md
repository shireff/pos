# Phase 04 — Categories & Units TODO

## Database

- [ ] Create MongoDB migration `004_categories_units_schema.ts`: categories collection with parent_id (nullable), sort_order, level (denormalized depth for efficient tree queries), path (materialized path string for subtree queries); units collection with is_base_unit, conversion_factor_to_base
- [ ] Add index: categories (companyId, parentId) for tree traversal
- [ ] Add index: categories (companyId, path) for subtree queries
- [ ] Add unique index: units (companyId, abbreviation)
- [ ] JSON Schema validator: categories requires name.ar, allows name.en, parentId nullable
- [ ] JSON Schema validator: units requires name.ar, abbreviation, conversionFactorToBase > 0

## Domain — Catalog

- [ ] Implement `Category` aggregate: id (UUIDv7), companyId, name (ar/en), parentId (nullable), sortOrder, level, path (materialized path), isActive
- [ ] Implement circular-parent guard in Category domain service: before setting parentId, verify no ancestor chain leads back to this category
- [ ] Implement tree reorder logic: when sortOrder changes, update siblings' sortOrder atomically
- [ ] Implement subtree deactivation: archiving a category soft-deletes all children recursively
- [ ] Implement `UnitOfMeasure` entity: id, companyId, name (ar/en), abbreviation, isBaseUnit, conversionFactorToBase (must be 1.0 for base units)
- [ ] Validate: each company has exactly one base unit per measurement dimension (length, weight, volume, count)

## Application — Use Cases

- [ ] `CreateCategoryCommand` + handler: validate unique name within sibling scope, compute level and path from parentId, emit CategoryCreated event
- [ ] `UpdateCategoryCommand` + handler: allow name and sortOrder changes; block parentId changes (prevent accidental tree restructuring) — tree moves require ReorderCategoryCommand
- [ ] `DeleteCategoryCommand` + handler: soft-delete; reject if any active product references this category
- [ ] `ReorderCategoryCommand` + handler: move category to new parent, recompute path and level for subtree, preserve sortOrder relative to new siblings
- [ ] `CreateUnitCommand` + handler: validate abbreviation uniqueness within company, validate conversionFactorToBase = 1.0 if isBaseUnit
- [ ] `UpdateUnitCommand` + handler: validate no active product_units reference this unit before changing conversionFactorToBase
- [ ] `GetCategoryTreeQuery` + handler: return full company category tree as nested structure

## API Endpoints

- [ ] `GET /v1/categories` — full tree as nested JSON; optional flat=true param for flat list
- [ ] `POST /v1/categories` — create; parentId optional (null = root)
- [ ] `PATCH /v1/categories/:id` — update name or sortOrder
- [ ] `DELETE /v1/categories/:id` — soft-delete (checks no active products)
- [ ] `POST /v1/categories/:id/move` — move to new parentId (tree restructure)
- [ ] `GET /v1/units` — all units for company
- [ ] `POST /v1/units` — create unit
- [ ] `PATCH /v1/units/:id` — update unit

## Validation (Zod)

- [ ] `CreateCategorySchema`: name.ar required string, name.en optional string, parentId optional UUIDv7, sortOrder optional number
- [ ] `UpdateCategorySchema`: name optional object, sortOrder optional number (parentId excluded — use move endpoint)
- [ ] `MoveCategorySchema`: newParentId UUIDv7 or null
- [ ] `CreateUnitSchema`: name.ar required, abbreviation required, isBaseUnit boolean, conversionFactorToBase positive number
- [ ] `UpdateUnitSchema`: all optional, at least one required

## Permissions

- [ ] Enforce `catalog.view` on all GET endpoints
- [ ] Enforce `catalog.create` on POST /v1/categories and POST /v1/units
- [ ] Enforce `catalog.edit` on PATCH and move endpoints
- [ ] Enforce `catalog.delete` on DELETE /v1/categories/:id
- [ ] 403 response always includes permissionCode

## Sync

- [ ] categories collection: Class B field-level HLC merge
- [ ] units collection: Class B field-level HLC merge
- [ ] Emit outbox events for all Create, Update, Delete, Reorder operations

## Desktop UI

- [ ] Category Tree Browser (`apps/desktop/src/features/categories/CategoryTreePage.tsx`): expandable/collapsible tree, inline rename on double-click, add child button per node, drag-and-drop reorder within same level, delete with confirmation (blocked if products exist)
- [ ] Unit Picker modal (`packages/ui-components/src/categories/UnitPickerModal.tsx`): searchable list with base unit indicator and conversion preview

## Android UI

- [ ] Category tree as collapsible accordion list (`apps/android/src/features/categories/CategoryTreePage.tsx`)
- [ ] Same Unit Picker modal using shared component
- [ ] All screens use shared components

## Shared Components

- [ ] `CategoryTreeNode.tsx`: node with expand/collapse, inline rename, add-child action
- [ ] `CategoryBreadcrumb.tsx`: breadcrumb path from root to current node
- [ ] `UnitConversionBadge.tsx`: shows "1 unit = X base-unit" label

## Tests

- [ ] See TESTS.md
