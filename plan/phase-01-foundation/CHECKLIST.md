# Phase 01 — Foundation Checklist

A phase is **NOT complete** until every item below is checked.

## Infrastructure

- [x] Monorepo npm workspace boots with all packages resolved
- [x] `strict: true` enforced in every `tsconfig.json`
- [ ] Layer-boundary lint rule BLOCKS a Domain→Infrastructure import (verified in CI, not just configured — run CI to confirm)
- [x] CI pipeline fails on lint error (`ci.yml` configured)
- [x] CI pipeline fails on TypeScript error (`ci.yml` configured)
- [ ] CI pipeline passes on clean code (needs full run verification)

## shared-kernel

- [x] `Money` value object handles EGP minor units, arithmetic, formatting
- [x] `DateTime` value object renders UTC timestamps in Africa/Cairo timezone
- [x] `Identifier` generates UUIDv7 client-side
- [x] `Result<T, E>` type is chainable and tested
- [x] `DomainEventBase` carries eventId, occurredAt, aggregateId, aggregateType
- [x] `HybridLogicalClock` advances, updates from incoming, serializes correctly
- [ ] All shared-kernel unit tests pass (tests exist — need to run `npm test` to confirm green)

## Database

- [x] MongoDB infrastructure package created with MongoConnection, encryption, migration runner
- [x] Field-level encryption via libmongocrypt configured (`encryption.ts`)
- [ ] Local MongoDB file is unreadable as plaintext (encryption verification test NOT YET WRITTEN)
- [x] Migration runner applies `001_initial_schema.ts`
- [ ] Migration runner idempotency confirmed by running test suite
- [x] JSON Schema validators created for all 7 core collections

## Backup

- [x] Local disk adapter written and tested (`local-disk.adapter.ts` + test)
- [x] Integrity checksum included in BackupPayload
- [ ] Integration test: corrupted backup rejected with plain-language error (not yet written)
- [x] Supabase Storage adapter written and tested
- [x] BackupQueue written and tested
- [x] BackupScheduler written

## Desktop (Tauri + Next.js)

- [x] `apps/desktop/` scaffold exists with package.json, tsconfig.json, main.tsx
- [x] DI container (`di-container.ts`) and Tauri bridge (`tauri-bridge.ts`) written
- [x] HealthScreen shared component created
- [ ] `src-tauri/` Rust side + `tauri.conf.json` not yet found — needs setup
- [ ] Tauri app builds and launches on Windows (not yet verified)
- [ ] No Electron dependency anywhere in the codebase (verify with `npm ls electron`)

## Android (Capacitor + Next.js)

- [ ] `apps/android/` does NOT exist yet — needs scaffolding
- [ ] Capacitor APK builds and runs on Android emulator
- [ ] No Kotlin/Java UI code

## Backend (Next.js 15 App Router)

- [ ] `apps/backend/` does NOT exist yet — needs scaffolding
- [ ] `GET /api/health` route handler
- [ ] Docker-compose: backend + PostgreSQL + Redis

## Documentation

- [x] Root `README.md` exists
- [x] `packages/shared-kernel/README.md` documents exported types

## Production Readiness

- [ ] Zero TypeScript errors across all packages (run `npm run typecheck`)
- [ ] Zero ESLint errors across all packages (run `npm run lint`)
- [ ] All unit and integration tests pass (run `npm test`)
- [ ] No placeholder implementations or TODO comments in code
