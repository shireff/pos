# Phase 04 — Categories & Units Checklist

A phase is **NOT complete** until every item below is checked.

## Database

- [ ] Migration `004_categories_units_schema.ts` applies cleanly
- [ ] materialized path (path field) computes correctly for nested categories
- [ ] Unique index on units abbreviation within company enforced

## Domain

- [ ] Category aggregate with parent-child hierarchy implemented
- [ ] Circular-parent guard rejects any attempt to create a circular reference
- [ ] Subtree deactivation correctly soft-deletes all children
- [ ] UnitOfMeasure entity with conversion factor validation implemented
- [ ] Base unit conversion_factor_to_base = 1.0 enforced at domain layer

## Application

- [ ] CreateCategoryCommand, UpdateCategoryCommand, DeleteCategoryCommand, ReorderCategoryCommand all implemented with tests
- [ ] DeleteCategoryCommand rejects if any active product references the category
- [ ] ReorderCategoryCommand correctly recomputes path and level for moved subtree
- [ ] CreateUnitCommand and UpdateUnitCommand implemented with tests

## API

- [ ] GET /v1/categories returns full tree (nested) and flat list (flat=true param)
- [ ] POST /v1/categories/move endpoint restructures tree correctly
- [ ] All 5 category endpoints and 3 unit endpoints tested for permission enforcement
- [ ] Zod validation schemas in place for all endpoints

## Sync

- [ ] Categories and units in sync outbox on all mutations

## Desktop UI

- [ ] Category tree browser renders with expand/collapse and inline rename
- [ ] Drag-and-drop reorder works within same level
- [ ] Delete blocked with message if products reference category
- [ ] Unit Picker modal shows conversion preview

## Android UI

- [ ] Collapsible tree list renders on Android
- [ ] Unit Picker modal works on Android

## Tests

- [ ] Tree integrity test: circular parent reference rejected
- [ ] Unit conversion round-trip test passes
- [ ] Permission enforcement tests for all endpoints

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
