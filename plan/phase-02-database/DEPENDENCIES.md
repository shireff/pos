# Phase 02 — Authentication & Licensing Dependencies

## Incoming

- Phase 01 (Foundation) must be complete — needs MongoDB connection, shared-kernel types, both app shells booting

## Outgoing (phases blocked until Phase 02 exits)

- Phase 03 (Products) — needs auth middleware and permission enforcement
- Phase 04 (Categories & Units) — same
- All subsequent phases — every API endpoint requires auth; every write requires subscription guard

## Documents Used

- Security.md (all sections)
- API.md §2, §4.8, §8
- Database.md §2.4–2.5, §2.16–2.16.3
- Permission_Matrix.md (all 21 sections)
- State_Machines.md §6, §7, §8
- Event_Catalog.md §2, §10
- Business_Rules.md §9, §12
- Notifications.md §3 (trial/billing triggers)
- UI_UX.md §1, §2.7
- Configuration_System.md §8, §15
- Error_Catalog.md §2, §3, §4

## Shared Modules Produced

- `packages/domain/identity` — consumed by all feature phases for permission checks
- `packages/domain/billing` — consumed by subscription guard in all write commands
- `packages/application/identity` — login/auth use cases
- `packages/infrastructure/mongodb/repositories/user.repository.ts`
- `packages/ui-components/src/auth/*` — shared by Desktop and Android
- `packages/ui-components/src/billing/*` — shared by Desktop and Android
- `require-permission` middleware — used by all API controllers in later phases
- `subscription-write-lock` middleware — used by all state-changing API endpoints
