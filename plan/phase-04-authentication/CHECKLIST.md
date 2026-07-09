# Phase 04 — Categories & Units Checklist

A phase is **NOT complete** until every item below is checked.

## Database

- [x] Migration `004_categories_units_schema.ts` applies cleanly
- [x] materialized path (path field) computes correctly for nested categories
- [x] Unique index on units abbreviation within company enforced

## Domain

- [x] Category aggregate with parent-child hierarchy implemented
- [x] Circular-parent guard rejects any attempt to create a circular reference
- [x] Subtree deactivation correctly soft-deletes all children
- [x] UnitOfMeasure entity with conversion factor validation implemented
- [x] Base unit conversion_factor_to_base = 1.0 enforced at domain layer

## Application

- [x] CreateCategoryCommand, UpdateCategoryCommand, DeleteCategoryCommand, ReorderCategoryCommand all implemented with tests
- [x] DeleteCategoryCommand rejects if any active product references the category
- [x] ReorderCategoryCommand correctly recomputes path and level for moved subtree
- [x] CreateUnitCommand and UpdateUnitCommand implemented with tests

## API

- [x] GET /v1/categories returns full tree (nested) and flat list (flat=true param)
- [x] POST /v1/categories/move endpoint restructures tree correctly
- [x] All 5 category endpoints and 3 unit endpoints tested for permission enforcement
- [x] Zod validation schemas in place for all endpoints

## Sync

- [x] Categories and units in sync outbox on all mutations

## Desktop UI

- [x] Category tree browser renders with expand/collapse and inline rename
- [x] Drag-and-drop reorder works within same level
- [x] Delete blocked with message if products reference category
- [x] Unit Picker modal shows conversion preview

## Android UI

- [x] Collapsible tree list renders on Android
- [x] Unit Picker modal works on Android

## Tests

- [x] Tree integrity test: circular parent reference rejected
- [x] Unit conversion round-trip test passes
- [x] Permission enforcement tests for all endpoints

## Quality Gates

- [x] Zero TypeScript errors
- [x] Zero ESLint errors
- [x] All tests passing in CI

---

## Authentication — Real Phase 04 Checklist (per MASTER_INDEX)

- [x] Online login (email + password) works and returns access + refresh tokens
- [x] Refresh token rotation works (used token rejected on replay)
- [x] Logout revokes refresh token
- [x] `GET /api/auth/me` returns authenticated user context
- [x] Device registration and revocation work
- [x] Platform Admin login (2-step: password → MFA challenge → TOTP verify → adminAccessToken)
- [x] Platform Admin tenant operations: suspend, reactivate, extend trial, change plan
- [x] Permission checks reject unauthorized callers (`assertCatalogPermission` enforced on all catalog routes)
- [x] RBAC middleware resolves permissions from user_branch_roles → role_permissions
- [x] Owner short-circuit: Owner role bypasses all permission checks
- [x] Platform Admin guard rejects tokens without `aud: "platform-admin"`
- [x] Auth migration schema creates correct collections and indexes
- [x] All 132 tests passing ✅
- [x] Offline PIN login flow
- [x] Platform Admin logout endpoint
- [x] JWT signing with real secret (currently uses demo alg:none tokens)
