# Phase 01 — Foundation Dependencies

## Incoming Dependencies

- None. This is the first phase. Nothing must exist before it.

## Outgoing Dependencies (phases blocked until Phase 01 exits)

- ALL phases (02–20) depend on Phase 01 completing its exit gate.
- No business feature can be built until the monorepo scaffold is correct, the layer-boundary lint rule is working, and both app shells boot against encrypted MongoDB.

## Blocking Phases

- Phase 02 (Authentication & Licensing) — needs MongoDB connection and shared-kernel types
- Phase 03 (Products) — needs Domain/Application scaffold and database
- All subsequent phases

## Shared Modules Produced

- `packages/shared-kernel` — consumed by every other package
- `packages/infrastructure/mongodb` — consumed by all repository implementations
- `packages/infrastructure/backup` — consumed by Phase 17 (Backup & Restore)
- `packages/ui-components` — consumed by all UI phases
- `apps/desktop` bootstrap — consumed by Desktop shell wiring in all phases
- `apps/android` bootstrap — consumed by Android shell wiring in all phases
- `apps/backend` scaffold — consumed by all API phases

## Documents Used

- Architecture.md (§1–9)
- Coding_Standards.md (all sections)
- Project_Structure.md (all sections)
- Database.md (§8 migrations, §9 backup)
- Security.md (§3.1 encryption at rest, §8 backup encryption)
- Hardware.md (§0 cross-platform policy)
- Sync_Architecture.md (§S1 assumption — MongoDB local is source of truth)

## External Dependencies (npm packages — pinned exact versions)

- `mongodb` — MongoDB Node.js driver
- `libmongocrypt` — field-level encryption
- `migrate-mongo` — migration runner (or custom equivalent)
- `uuidv7` — UUIDv7 client-side generation
- `vitest` — test runner
- `typescript` — strict mode
- `eslint` + `@typescript-eslint/eslint-plugin`
- `prettier`
- `husky` + `lint-staged`
- `next` — Next.js 15 (App Router) — used for Desktop shell, Android shell, and Backend
- `react` + `react-dom` — React 19 (bundled with Next.js)
- `@tauri-apps/api` — Tauri JS bridge (Desktop bootstrap only)
- `@capacitor/core` + `@capacitor/android` (Android bootstrap only)
- `supabase-js` — Supabase Storage client (backup adapter)
