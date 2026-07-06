# Phase 01 — Foundation TODO

> Legend: `[x]` = done, `[ ]` = requires manual verification (cannot be automated)

## 01 — Monorepo & Tooling

- [x] Initialize npm workspace with `package.json` workspaces field
- [x] Root `package.json` with workspace scripts: `dev`, `build`, `test`, `lint`, `typecheck`
- [x] Root `tsconfig.base.json` with `strict: true`, `module: "ES2022"`, `moduleResolution: "bundler"`
- [x] Per-package `tsconfig.json` extending the base
- [x] ESLint with `@typescript-eslint` — `no-explicit-any` as CI-blocking error
- [x] Prettier with shared config; pre-commit hook via `husky` + `lint-staged`
- [x] Layer-boundary lint rule: blocks `react`, `@tauri-apps/*`, `@capacitor/*`, `mongodb` in `domain`/`application`
- [x] Layer-boundary enforcement test (`packages/layer-boundary.test.ts`) — 4 scenarios, passing
- [x] Vitest test runner configured across all packages
- [x] GitHub Actions CI: `ci.yml` (lint → typecheck → test) + `commit-check.yml` (conventional commits)

## 02 — shared-kernel Package

- [x] `Money` — integer piasters, add/subtract/multiply, EGP format, 8 passing tests
- [x] `DateTime` — UTC storage, Africa/Cairo rendering, 4 passing tests
- [x] `Identifier` — UUIDv7 client-generated, 3 passing tests
- [x] `Result<T, E>` — Ok/Err, chainable map/flatMap/getOrThrow, 5 passing tests
- [x] `DomainEventBase` — eventId (UUIDv7), occurredAt (UTC), aggregateId, aggregateType
- [x] `HybridLogicalClock` — advance, update(incoming), serialize/deserialize, 5 passing tests
- [x] `logger` — structured JSON to stdout/stderr, suppresses debug in production, 3 passing tests
- [x] Package README documenting every exported type

## 03 — Domain & Application

- [x] `identity` — Company, Branch, User aggregates; Permission, Role, Device entities; PermissionResolver
- [x] `catalog` — Product aggregate with Variants/Bundles/Units; Barcode VO; BarcodeGenerator; UnitConversionService
- [x] `inventory` — StockMovementEvent (append-only); StockItem projection; StockTransfer lifecycle; FefoService; StockProjectionService
- [x] `sales` — Order/OrderLine/Payment/Return aggregates; TenderValidator; OrderStatusService; all domain events
- [x] `purchasing` — PurchaseOrder lifecycle (draft→received); Supplier entity; PODiscrepancyChecker; SupplierPerformanceCalculator
- [x] `crm` — Customer aggregate; LoyaltyAccount (event-stream); CreditLedger; LoyaltyCalculator; CustomerCreditService
- [x] `promotions` — Discount + Coupon aggregates (rule_json driven); DiscountEngine (8 discount types)
- [x] `tax` — TaxRule entity; TaxRuleSet; TaxCalculationService; ETAInvoice lifecycle
- [x] `sync` — SyncOutboxEntry, SyncInboxEntry, SyncConflict entities; HLCMergeService; IdempotencyChecker
- [x] `billing` — Subscription aggregate with 5-step entitlement resolution; SubscriptionPlan; LicenseKey; EntitlementResolver; TrialReminder
- [x] `audit` — AuditEntry (append-only); AuditLogger domain service
- [x] `platform-admin` — PlatformAdminUser aggregate; PlatformAdminAction (append-only); AdvisoryOnlyGuard; PlatformAdminActionRecorder
- [x] `ai-insights` — AIPrediction, AIRecommendation aggregates; advisory-only lifecycle enforced at domain; FraudScorer; AcceptanceRateTracker
- [x] Application layer ports for: identity, catalog, inventory, sales, purchasing, crm, billing, sync

## 04 — MongoDB Local Database

- [x] `MongoConnection` — connects, exposes `db()`, handles encryption init
- [x] `encryption.ts` — libmongocrypt field-level encryption, OS keystore integration
- [x] `MigrationRunner` — versioned, idempotent, `createRequire` (no bare require)
- [x] Migration `001_initial_schema.ts` — all collections + JSON Schema validators
- [x] Migration runner integration test — 4 scenarios passing (MongoDB skipped gracefully in CI)
- [x] All 7 JSON Schema validators (companies, users, products, orders, stock_movement_events, sync_outbox, audit_entries)
- [x] `encryption-verification.test.ts` — AES-256-GCM: file unreadable as plaintext, wrong key throws, correct key decrypts

## 05 — Backup Infrastructure

- [x] `BackupPayload` type (gzip + AES-256-GCM + SHA-256 + timestamp)
- [x] `LocalDiskAdapter` — write/read/verify/list, 6-scenario integration test passing
- [x] `SupabaseStorageAdapter` — upload/download/list, typed mock (no `any`), 3 tests passing
- [x] `BackupQueue` — InMemoryBackupQueueStorage, drain on reconnect, 3 tests passing
- [x] `BackupScheduler` — daily interval + manual trigger
- [x] `backup-integration.test.ts` — clean backup restores correctly; corrupt file rejected with plain-language error

## 06 — Desktop Shell (Tauri + Next.js)

- [x] `apps/desktop/` — Tauri + Next.js + TypeScript scaffolded
- [x] `src-tauri/tauri.conf.json` — app name, identifier, window settings, allowlist, bundle config
- [x] `src-tauri/src/main.rs` + `Cargo.toml`
- [x] `di-container.ts` — wires MongoConnection, BackupScheduler, adapters via constructor injection
- [x] `tauri-bridge.ts` — typed invoke wrapper with isTauri() guard
- [x] `App.tsx` — health-check screen, uses shared HealthScreen component
- [x] `HealthScreen.tsx` — shared component (Desktop + Android), renders DB/encryption/version status
- [ ] **MANUAL**: confirm `npm run dev --workspace=apps/desktop` builds and health screen renders
- [ ] **MANUAL**: confirm local MongoDB starts and encryption is confirmed active at startup

## 07 — Android Shell (Capacitor + Next.js)

- [x] `apps/android/` — Capacitor + Next.js + TypeScript scaffolded
- [x] `capacitor.config.ts` — appId, appName, server settings
- [x] `di-container.ts` — Capacitor bootstrap, exports CapacitorHealthBridge
- [x] `capacitor-health.bridge.ts` — Capacitor plugin bridge
- [x] `src/app/page.tsx` — health-check screen (Arabic RTL, shared design language)
- [ ] **MANUAL**: confirm APK builds (`npx cap sync android` + open in Android Studio)
- [ ] **MANUAL**: confirm health screen renders on Android emulator

## 08 — Backend (Next.js 15 App Router)

- [x] `GET /api/health` — returns `{ status: "ok", timestamp, version, requestId }` with X-Request-Id header
- [x] `src/middleware.ts` — request ID generation + in-memory rate limiting (Redis-ready)
- [x] `src/lib/errors.ts` — DomainError → API envelope mapping
- [x] `Dockerfile` + `docker-compose.yml` — backend + PostgreSQL + Redis
- [ ] **MANUAL**: confirm `docker-compose up` in `apps/backend/` starts all services
- [ ] **MANUAL**: confirm `GET /api/health` responds 200

## 09 — CI Verification

- [x] Layer-boundary lint rule blocks cross-layer imports (verified by layer-boundary.test.ts passing)
- [x] GitHub Actions CI configured and running
- [x] `package-lock.json` committed — `npm ci` works in CI
- [x] Zero bare `console.log` in production code (structured logger only)
- [x] Zero `any` types, zero `eslint-disable` suppressions
- [x] All 58 unit + integration tests pass locally (`npm test`)
- [x] `.gitignore` covers `node_modules/`, `.next/`, `*.tsbuildinfo`, `nul`
- [ ] **MANUAL**: verify full CI run green on GitHub Actions (push and check Actions tab)
