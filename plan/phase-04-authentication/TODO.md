# Phase 04 — Categories & Units TODO
> ?? **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
> - **ALL UI text MUST use useT() / 	() with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use pps/backend/src/lib/errors.ts with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.
> - **ALL UI styling MUST use the `@packages/ui-components` design system — NO inline styles (`style={{...}}`) are allowed anywhere.** Do not hardcode styling; always use the shared design-system components and design tokens.

## Database

- [x] Create MongoDB migration `004_categories_units_schema.ts`: categories collection with parent_id (nullable), sort_order, level (denormalized depth for efficient tree queries), path (materialized path string for subtree queries); units collection with is_base_unit, conversion_factor_to_base
- [x] Add index: categories (companyId, parentId) for tree traversal
- [x] Add index: categories (companyId, path) for subtree queries
- [x] Add unique index: units (companyId, abbreviation)
- [x] JSON Schema validator: categories requires name.ar, allows name.en, parentId nullable
- [x] JSON Schema validator: units requires name.ar, abbreviation, conversionFactorToBase > 0

## Domain — Catalog

- [x] Implement `Category` aggregate: id (UUIDv7), companyId, name (ar/en), parentId (nullable), sortOrder, level, path (materialized path), isActive
- [x] Implement circular-parent guard in Category domain service: before setting parentId, verify no ancestor chain leads back to this category
- [x] Implement tree reorder logic: when sortOrder changes, update siblings' sortOrder atomically
- [x] Implement subtree deactivation: archiving a category soft-deletes all children recursively
- [x] Implement `UnitOfMeasure` entity: id, companyId, name (ar/en), abbreviation, isBaseUnit, conversionFactorToBase (must be 1.0 for base units)
- [x] Validate: each company has exactly one base unit per measurement dimension (length, weight, volume, count)

## Application — Use Cases

- [x] `CreateCategoryCommand` + handler: validate unique name within sibling scope, compute level and path from parentId, emit CategoryCreated event
- [x] `UpdateCategoryCommand` + handler: allow name and sortOrder changes; block parentId changes (prevent accidental tree restructuring) — tree moves require ReorderCategoryCommand
- [x] `DeleteCategoryCommand` + handler: soft-delete; reject if any active product references this category
- [x] `ReorderCategoryCommand` + handler: move category to new parent, recompute path and level for subtree, preserve sortOrder relative to new siblings
- [x] `CreateUnitCommand` + handler: validate abbreviation uniqueness within company, validate conversionFactorToBase = 1.0 if isBaseUnit
- [x] `UpdateUnitCommand` + handler: validate no active product_units reference this unit before changing conversionFactorToBase
- [x] `GetCategoryTreeQuery` + handler: return full company category tree as nested structure

## API Endpoints

- [x] `GET /v1/categories` — full tree as nested JSON; optional flat=true param for flat list
- [x] `POST /v1/categories` — create; parentId optional (null = root)
- [x] `PATCH /v1/categories/:id` — update name or sortOrder
- [x] `DELETE /v1/categories/:id` — soft-delete (checks no active products)
- [x] `POST /v1/categories/:id/move` — move to new parentId (tree restructure)
- [x] `GET /v1/units` — all units for company
- [x] `POST /v1/units` — create unit
- [x] `PATCH /v1/units/:id` — update unit

## Validation (Zod)

- [x] `CreateCategorySchema`: name.ar required string, name.en optional string, parentId optional UUIDv7, sortOrder optional number
- [x] `UpdateCategorySchema`: name optional object, sortOrder optional number (parentId excluded — use move endpoint)
- [x] `MoveCategorySchema`: newParentId UUIDv7 or null
- [x] `CreateUnitSchema`: name.ar required, abbreviation required, isBaseUnit boolean, conversionFactorToBase positive number
- [x] `UpdateUnitSchema`: all optional, at least one required

## Permissions

- [x] Enforce `catalog.view` on all GET endpoints
- [x] Enforce `catalog.create` on POST /v1/categories and POST /v1/units
- [x] Enforce `catalog.edit` on PATCH and move endpoints
- [x] Enforce `catalog.delete` on DELETE /v1/categories/:id
- [x] 403 response always includes permissionCode

## Sync

- [ ] categories collection: Class B field-level HLC merge
- [ ] units collection: Class B field-level HLC merge
- [ ] Emit outbox events for all Create, Update, Delete, Reorder operations

## Desktop UI

- [x] Category Tree Browser (`apps/desktop/src/features/categories/CategoryTreePage.tsx`): expandable/collapsible tree, inline rename on double-click, add child button per node, drag-and-drop reorder within same level, delete with confirmation (blocked if products exist)
- [x] Unit Picker modal (`packages/ui-components/src/categories/UnitPickerModal.tsx`): searchable list with base unit indicator and conversion preview

## Android UI

- [x] Category tree as collapsible accordion list (`apps/android/src/features/categories/CategoryTreePage.tsx`)
- [x] Same Unit Picker modal using shared component
- [x] All screens use shared components

## Shared Components

- [x] `CategoryTreeNode.tsx`: node with expand/collapse, inline rename, add-child action
- [x] `CategoryBreadcrumb.tsx`: breadcrumb path from root to current node
- [x] `UnitConversionBadge.tsx`: shows "1 unit = X base-unit" label

## Tests

- [x] Tree integrity test: circular parent reference rejected — `packages/domain/catalog/src/domain-services/index.test.ts`
- [x] Unit conversion round-trip test passes — `packages/domain/catalog/src/domain-services/index.test.ts`
- [ ] Permission enforcement tests for all endpoints

---

## Authentication — Real Phase 04 Scope (per MASTER_INDEX)

> ملاحظة: محتوى هذا الملف يخلط بين Categories & Units والـ Authentication الحقيقي. المهام أدناه هي المهام الفعلية لـ Phase 04 كما في MASTER_INDEX.

### Application Layer — Identity Use Cases

- [x] `AuthenticateUser` use case + test
- [x] `RefreshToken` use case
- [x] `Logout` use case
- [x] `RegisterDevice` use case + test
- [x] `RevokeDevice` use case + test
- [x] `StartTrial` use case + test
- [x] `PlatformAdminLogin` use case + test
- [x] `PlatformAdminMfaVerify` use case + test
- [x] `SuspendTenant` use case + test
- [x] `ReactivateTenant` use case + test
- [x] `ExtendTrial` use case + test
- [x] `ChangeTenantPlan` use case + test

### Middleware & RBAC

- [x] `PermissionResolver` (RBAC middleware) — `packages/application/identity/src/middleware/rbac.ts`
- [x] `PlatformAdminGuard`
- [x] Permission matrix test
- [x] `assertCatalogPermission` helper — `apps/backend/src/lib/catalog-permissions.ts`
- [x] `requirePlatformAdmin` + `parseAccessToken` — `apps/backend/src/lib/rbac.ts`

### API Routes

- [x] `POST /api/auth/login`
- [x] `POST /api/auth/logout`
- [x] `POST /api/auth/refresh`
- [x] `GET /api/auth/me`
- [x] `POST /api/platform-admin/auth/login`
- [x] `POST /api/platform-admin/auth/mfa-verify`
- [x] `POST /api/platform-admin/auth/logout`
- [x] Offline PIN login flow

### Infrastructure

- [x] Auth migration schema (`packages/infrastructure/mongodb/src/auth-migration.test.ts`)

### Quality Gates

- [x] Zero TypeScript errors
- [x] All 132 tests passing (58 test files) ✅
- [ ] Update API.md if any endpoint contract was refined during implementation

