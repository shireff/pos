# Phase 01 — Foundation TODO

> Legend: `[x]` = done, `[ ]` = not done yet

## 01 — Monorepo & Tooling

- [x] Initialize npm workspace with `package.json` workspaces field listing all `apps/*` and `packages/*`
- [x] Create root `package.json` with workspace scripts: `dev`, `build`, `test`, `lint`, `typecheck`
- [x] Configure root `tsconfig.base.json` with `strict: true`, `strictNullChecks`, `noImplicitAny`
- [x] Create per-package `tsconfig.json` extending the base
- [x] Install and configure ESLint with `@typescript-eslint` ruleset — `no-explicit-any` as error
- [x] Install Prettier with a shared config; wire pre-commit hook via `husky` + `lint-staged`
- [x] Add layer-boundary lint rule: block imports of `react`, `@tauri-apps/*`, `@capacitor/*`, `mongodb` from `packages/domain` and `packages/application`
- [x] Write layer-boundary enforcement test (`packages/layer-boundary.test.ts`)
- [x] Set up Vitest as the test runner across all packages
- [x] Set up GitHub Actions CI: lint → typecheck → test on every PR (`ci.yml` + `commit-check.yml`)
- [x] Add `conventional-commits` enforcement in CI (`commit-check.yml`)

## 02 — shared-kernel Package

- [x] Create `packages/shared-kernel/` with its own `package.json` and `tsconfig.json`
- [x] Implement `Money` value object (integer piasters, add/subtract/multiply, EGP format)
- [x] Implement `DateTime` value object (UTC, renders in Africa/Cairo timezone)
- [x] Implement `Identifier` (UUIDv7 client-generated)
- [x] Implement `Result<T, E>` type (Ok/Err, chainable map/flatMap/getOrThrow)
- [x] Implement `DomainEventBase` (eventId, occurredAt, aggregateId, aggregateType)
- [x] Implement `HybridLogicalClock` (advance, update, serialize/deserialize)
- [x] Implement `logger` (structured JSON logger, never bare console.log)
- [x] Write unit tests for all shared-kernel types
- [x] Write package README documenting every exported type's contract

## 03 — Domain & Application Scaffolds

- [x] Create `packages/domain/` with all 13 bounded context sub-packages
- [x] `identity` — real entities, aggregates, value-objects, domain-events, domain-services implemented
- [x] `catalog` — real entities, aggregates, value-objects, domain-events, domain-services implemented
- [x] `inventory` — real entities, aggregates, value-objects, domain-events, domain-services implemented
- [x] `sales` — real entities, aggregates, value-objects implemented; domain-events and domain-services need replacement
- [ ] `purchasing` — generic skeleton code, needs real implementation
- [ ] `crm` — generic skeleton code, needs real implementation
- [ ] `promotions` — generic skeleton code, needs real implementation
- [ ] `tax` — generic skeleton code, needs real implementation
- [ ] `sync` — generic skeleton code, needs real implementation
- [ ] `billing` — generic skeleton code, needs real implementation
- [ ] `audit` — generic skeleton code, needs real implementation
- [ ] `platform-admin` — generic skeleton code, needs real implementation
- [ ] `ai-insights` — generic skeleton code, needs real implementation
- [x] Create `packages/application/` with all 8 bounded context sub-packages (scaffold — populated in later phases)
- [x] Layer-boundary lint rule verified working in CI

## 04 — MongoDB Local Database

- [x] `packages/infrastructure/mongodb/` package
- [x] `MongoConnection` — connects, exposes `db()`, handles encryption init
- [x] `encryption.ts` — field-level encryption via libmongocrypt + OS keystore
- [x] `MigrationRunner` — versioned, idempotent, uses `createRequire` (no bare require)
- [x] Migration `001_initial_schema.ts` — creates all collections with JSON Schema validators
- [x] Migration runner integration test (`migration-runner.test.ts`)
- [x] All 7 JSON Schema validators (companies, users, products, orders, stock_movement_events, sync_outbox, audit_entries)
- [ ] Encryption verification test — confirm local MongoDB file is unreadable as plaintext

## 05 — Backup Infrastructure

- [x] `packages/infrastructure/backup/` package
- [x] `BackupPayload` type (gzip+AES-256+SHA-256+timestamp)
- [x] `LocalDiskAdapter` — write, read, verify checksum, list snapshots
- [x] `SupabaseStorageAdapter` — upload, download, list, queue when offline (typed mock, no `any`)
- [x] `BackupQueue` — durable queue (InMemoryBackupQueueStorage for Phase 01)
- [x] `BackupScheduler` — daily interval + manual trigger
- [x] Unit tests: `local-disk.adapter.test.ts`, `backup-queue.test.ts`, `supabase-storage.adapter.test.ts`
- [ ] Integration test: corrupt backup → restore fails; clean backup → restore succeeds

## 06 — Desktop Shell (Tauri + Next.js)

- [x] `apps/desktop/` scaffolded with Tauri + Next.js + TypeScript
- [x] `src-tauri/tauri.conf.json` — app name, identifier, window settings, allowlist, bundle config
- [x] `src-tauri/src/main.rs` — Tauri entry point
- [x] `src-tauri/Cargo.toml` — Rust dependencies
- [x] `apps/desktop/src/bootstrap/di-container.ts` — wires MongoConnection, BackupScheduler, adapters
- [x] `apps/desktop/src/bootstrap/tauri-bridge.ts` — Tauri invoke wrapper, isTauri() guard
- [x] `apps/desktop/src/app/App.tsx` — health-check screen using shared HealthScreen component
- [x] `packages/ui-components/src/health-screen/HealthScreen.tsx` — shared component (Desktop + Android)
- [ ] Confirm Desktop app builds and health screen renders (manual verification)
- [ ] Confirm local MongoDB runs and encryption is active when Desktop app starts (manual)

## 07 — Android Shell (Capacitor + Next.js)

- [x] `apps/android/` scaffolded with Capacitor + Next.js + TypeScript
- [x] `apps/android/capacitor.config.ts` — appId, appName, server settings
- [x] `apps/android/src/bootstrap/di-container.ts` — Capacitor bootstrap, exports CapacitorHealthBridge
- [x] `apps/android/src/bootstrap/capacitor-health.bridge.ts` — Capacitor plugin bridge
- [x] `apps/android/src/app/page.tsx` — health-check screen (Arabic RTL, shared design language)
- [ ] Confirm APK builds and health screen renders on Android emulator (manual verification)
- [ ] Confirm local MongoDB runs and encryption is active on Android (manual)

## 08 — Backend Scaffold (Next.js 15 App Router)

- [x] `apps/backend/` scaffolded with Next.js 15 + TypeScript
- [x] `GET /api/health` route handler — returns `{ status: "ok", timestamp, version, requestId }`
- [x] `src/middleware.ts` — request ID generation + rate limiting skeleton (in-memory, Redis-ready)
- [x] `src/lib/errors.ts` — DomainError → API envelope mapping
- [x] `apps/backend/Dockerfile` — backend container
- [x] `apps/backend/docker-compose.yml` — backend + PostgreSQL + Redis
- [ ] Confirm `docker-compose up` starts all services and health endpoint responds (manual)

## 09 — CI Verification

- [x] Layer-boundary lint rule enforced in CI (layer-boundary.test.ts + ESLint config)
- [x] GitHub Actions CI runs lint → typecheck → test on every PR
- [x] `package-lock.json` committed — `npm ci` works in CI
- [x] Structured logger — zero bare `console.log` in production code
- [x] Zero `any` types, zero `eslint-disable` suppressions in committed code
- [ ] Encryption verification test — local MongoDB file unreadable as plaintext (CI test, not just manual)
- [ ] Full CI run green (lint + typecheck + all tests pass) — verify on GitHub Actions
