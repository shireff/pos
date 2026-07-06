# Phase 04 — Categories & Units Tests

## Unit Tests

- Category tree: parent-child hierarchy resolves correctly
- Category with children cannot be deleted (soft-archive cascades to children)
- Unit with conversion_factor_to_base = 0 is rejected
- Unit conversion is reversible: base → derived → base returns original value (no rounding drift)
- Company A categories are not visible to Company B (tenant isolation)

## Integration Tests

- POST /v1/categories creates root-level category
- POST /v1/categories with parentId creates child category
- GET /v1/categories returns full tree for the caller's company
- DELETE /v1/categories/:id archives the category and all its children (soft delete)
- GET /v1/units returns all units for the company
- Caller without catalog.view permission receives 403

## Sync Tests

- Category created on Desktop → syncs to Android (Class B merge)
- Category name edited on two devices with same field → conflict queued
- Category archived on one device, renamed on another → both applied (archived + renamed)

## E2E Tests

- Create category tree on Desktop → visible in product picker on Android
- Assign product to category on Desktop → category filter works on Android
