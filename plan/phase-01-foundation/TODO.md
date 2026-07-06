# Phase 01 — Foundation TODO

> Legend: `[x]` = done, `[ ]` = not started yet

## 01 — Monorepo & Tooling

- [x] Initialize npm workspace with `package.json` workspaces field listing all `apps/*` and `packages/*`
- [x] Create root `package.json` with workspace scripts: `dev`, `build`, `test`, `lint`, `typecheck`
- [x] Configure root `tsconfig.base.json` with `strict: true`, `strictNullChecks`, `noImplicitAny`
- [x] Create per-package `tsconfig.json` extending the base
- [x] Install and configure ESLint with `@typescript-eslint` ruleset — `no-explicit-any` as error
- [x] Install Prettier with a shared config; wire pre-commit hook via `husky` + `lint-staged`
- [x] Add layer-boundary lint rule: block imports of `react`, `@tauri-apps/*`, `@capacitor/*`, `mongodb` from `packages/domain` and `packages/application`
- [x] Write a test that deliberately imports a forbidden dependency (`packages/layer-boundary.test.ts` exists)
- [x] Set up Vitest as the test runner across all packages
- [x] Set up GitHub Actions CI: lint → typecheck → test on every PR (`ci.yml` + `commit-check.yml`)
- [x] Add `conventional-commits` enforcement in CI (`commit-check.yml`)

## 02 — shared-kernel Package

- [x] Create `packages/shared-kernel/` with its own `package.json` and `tsconfig.json`
- [x] Implement `Money` value object: stores integer minor units (piasters), supports add/subtract/multiply, rejects negative where not allowed, formats to EGP display string
- [x] Implement `DateTime` value object: wraps UTC timestamp, renders in configured timezone (default Africa/Cairo), never uses raw `Date` in feature code
- [x] Implement `Identifier` (UUIDv7): client-generated, timestamp-ordered, globally unique
- [x] Implement `Result<T, E>` type: `Ok<T>` | `Err<E>`, chainable `.map()`, `.flatMap()`, `.getOrThrow()`
- [x] Implement `DomainEventBase`: `eventId` (UUIDv7), `occurredAt` (UTC), `aggregateId`, `aggregateType`
- [x] Implement `HybridLogicalClock`: wall-clock + logical counter, `advance()`, `update(incoming)`, serializable to/from string
- [x] Write unit tests for all shared-kernel types — Money arithmetic edge cases, HLC ordering, Result composition
- [x] Write package README documenting every exported type's contract

## 03 — Domain & Application Scaffolds

- [x] Create `packages/domain/` with sub-packages for each bounded context: `identity`, `catalog`, `inventory`, `sales`, `purchasing`, `crm`, `promotions`, `tax`, `sync`, `billing`, `audit`, `platform-admin`, `ai-insights`
- [ ] Each sub-package: populate `entities/`, `value-objects/`, `aggregates/`, `domain-events/`, `domain-services/` folders with placeholder `index.ts` files (folders exist, internal structure may be empty)
- [x] Create `packages/application/` with matching sub-packages: `identity`, `catalog`, `inventory`, `sales`, `purchasing`, `crm`, `sync`, `billing`
- [ ] Confirm layer-boundary lint rule blocks a test import in `packages/domain/catalog/entities/index.ts` that imports from `packages/infrastructure` — run CI to verify, not just configure

## 04 — MongoDB Local Database

- [x] Add `packages/infrastructure/mongodb/` package
- [x] Implement `MongoConnection`: connects to embedded local MongoDB instance, exposes `db()` accessor
- [x] Configure MongoDB field-level encryption via `libmongocrypt` — derive encryption key from OS keystore (`encryption.ts` exists)
- [x] Implement migration runner: reads `migrations/` folder, applies numbered scripts in order, tracks in `_migrations` collection, is idempotent on re-run
- [x] Write migration `001_initial_schema.ts` that creates all collections and sets JSON Schema validators
- [x] Write integration test for migration runner (`migration-runner.test.ts` exists)
- [x] Create all 7 JSON Schema validators: companies, users, products, orders, stock_movement_events, sync_outbox, audit_entries
- [ ] Confirm the local MongoDB file is unreadable as plaintext when opened directly (encryption verification test — not yet written)

## 05 — Backup Infrastructure

- [x] Add `packages/infrastructure/backup/` package
- [x] Implement `BackupPayload` type: compressed (gzip), encrypted (AES-256, key derived independently from live DB key), timestamped, with SHA-256 integrity checksum
- [x] Implement `LocalDiskAdapter`: writes backup to configured local path, reads back for restore, lists available snapshots by timestamp
- [x] Implement `SupabaseStorageAdapter`: uploads encrypted backup file to Supabase Storage bucket, queues offline when unreachable
- [x] Implement `BackupQueue`: durable queue persisted in MongoDB; auto-drains when connectivity restored
- [x] Implement `BackupScheduler`: triggers daily incremental backup; fires manual backup on demand
- [x] Write unit tests: local backup adapter (`local-disk.adapter.test.ts`), queue (`backup-queue.test.ts`), Supabase adapter (`supabase-storage.adapter.test.ts`)
- [ ] Write integration test: full backup → corrupt file → restore fails with plain-language error; clean backup → restore succeeds

## 06 — Desktop Shell (Tauri + Next.js)

- [x] Scaffold `apps/desktop/` with Tauri + Next.js + TypeScript
- [ ] Configure `tauri.conf.json`: app name, identifier, window settings, allowed APIs (tauri.conf.json not yet found)
- [x] Implement `apps/desktop/src/bootstrap/di-container.ts`: wire `MongoConnection`, `BackupScheduler`, all infrastructure adapters via constructor injection
- [x] Implement `apps/desktop/src/bootstrap/tauri-bridge.ts`: expose Tauri commands for hardware adapters
- [x] Add minimal `apps/desktop/src/app/` with health-check screen
- [x] Create `packages/ui-components/src/health-screen/HealthScreen.tsx` (shared component)
- [ ] Confirm app builds and health screen renders
- [ ] Confirm local MongoDB instance is running and encrypted when Desktop app starts
- [ ] Confirm `src-tauri/` Rust side is configured (not yet found in directory scan)

## 07 — Android Shell (Capacitor + Next.js)

- [ ] Scaffold `apps/android/` with Capacitor + Next.js + TypeScript
- [ ] Configure `capacitor.config.ts`: appId, appName, server settings
- [ ] Install `@capacitor/core`, `@capacitor/android` — pinned exact versions
- [ ] Implement `apps/android/src/bootstrap/di-container.ts`: wire infrastructure adapters via Capacitor plugin bridges
- [ ] Add the same health-check screen (shared component from `packages/ui-components`)
- [ ] Confirm APK builds and health screen renders on Android emulator
- [ ] Confirm local MongoDB instance is running and encrypted on Android

## 08 — Backend Scaffold (Next.js App Router + API Routes)

- [ ] Scaffold `apps/backend/` with Next.js 15 + TypeScript (App Router, Route Handlers for REST API)
- [ ] Implement `GET /api/health` route handler returning `{ status: "ok", timestamp, version }`
- [ ] Implement global error-handling: maps `DomainError` → standard API envelope (API.md §3)
- [ ] Implement request ID middleware: generates `requestId`, attaches to all log lines and responses
- [ ] Implement rate limiting skeleton (API.md §6)
- [ ] Add Docker-compose: backend + PostgreSQL + Redis
- [ ] Confirm `docker-compose up` starts all services and health endpoint responds

## 09 — CI Verification

- [ ] Run CI on a branch that deliberately violates the layer-boundary lint rule — confirm it FAILS
- [ ] Run CI on a clean branch — confirm lint + typecheck + tests all PASS
- [ ] Confirm encryption test passes (MongoDB file is not readable as plaintext)
- [ ] Document `README.md` at repo root: how to run, build, test, and deploy
