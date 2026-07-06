# Phase 04 — Categories & Units Dependencies

## Incoming

- Phase 01 (Foundation)
- Phase 02 (Authentication & Licensing) — permission enforcement

## Outgoing (blocked until Phase 04 exits)

- Phase 03 (Products) — products must reference a valid category and unit of measure
- Phase 11 (Discounts & Taxes) — discount rules can be scoped to categories
- Phase 13 (Reports) — inventory valuation report groups by category

## Documents Used

- Database.md §2.6 (categories, product_units fields)
- PRD.md §4.3 (FR-3.1 — unlimited variant dimensions; FR-3.3 — unit conversions)
- Business_Rules.md §5 (BR-INV-006 — unit conversion recalculation)
- API.md §4.1 (catalog endpoints include categories and units)
- Sync_Architecture.md §3.2 (Class B field merge for categories)

## Shared Modules Produced

- `packages/domain/catalog/src/entities/category.entity.ts`
- `packages/domain/catalog/src/entities/unit-of-measure.entity.ts`
- `packages/infrastructure/mongodb/repositories/category.repository.ts`
- `packages/ui-components/src/catalog/CategoryTree.tsx`
- `packages/ui-components/src/catalog/UnitPicker.tsx`
