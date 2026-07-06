# Phase 01 — Foundation Files

Every file expected to be created or modified in this phase.

## Monorepo Root

```
package.json              ✅ exists
tsconfig.base.json        ✅ exists
.eslintrc.js              ✅ exists
.prettierrc               ✅ exists
.husky/pre-commit         ✅ exists
.github/workflows/ci.yml  ✅ exists
.github/workflows/commit-check.yml ✅ exists
README.md                 ✅ exists
vitest.config.ts          ✅ exists
pnpm-workspace.yaml       ✅ exists (REPLACE with npm workspaces in package.json)
infra/docker/docker-compose.yml    ❌ not yet created
infra/docker/backend.Dockerfile    ❌ not yet created
```

## packages/shared-kernel/

```
packages/shared-kernel/package.json    ✅ exists
packages/shared-kernel/tsconfig.json   ✅ exists
packages/shared-kernel/README.md       ✅ exists
packages/shared-kernel/src/money.ts           ✅ exists
packages/shared-kernel/src/money.test.ts      ✅ exists
packages/shared-kernel/src/date-time.ts       ✅ exists
packages/shared-kernel/src/date-time.test.ts  ✅ exists
packages/shared-kernel/src/identifier.ts      ✅ exists
packages/shared-kernel/src/identifier.test.ts ✅ exists
packages/shared-kernel/src/result.ts          ✅ exists
packages/shared-kernel/src/result.test.ts     ✅ exists
packages/shared-kernel/src/domain-event-base.ts ✅ exists
packages/shared-kernel/src/hlc.ts             ✅ exists
packages/shared-kernel/src/hlc.test.ts        ✅ exists
packages/shared-kernel/src/index.ts           ✅ exists
```

## packages/domain/ (scaffolds — no business logic yet)

```
packages/domain/identity/src/index.ts      ✅ exists
packages/domain/catalog/src/index.ts       ✅ exists
packages/domain/inventory/src/index.ts     ✅ exists
packages/domain/sales/src/index.ts         ✅ exists
packages/domain/purchasing/src/index.ts    ✅ exists
packages/domain/crm/src/index.ts           ✅ exists
packages/domain/promotions/src/index.ts    ✅ exists
packages/domain/tax/src/index.ts           ✅ exists
packages/domain/sync/src/index.ts          ✅ exists
packages/domain/billing/src/index.ts       ✅ exists
packages/domain/audit/src/index.ts         ✅ exists
packages/domain/platform-admin/src/index.ts ✅ exists
packages/domain/ai-insights/src/index.ts   ✅ exists
```

## packages/application/ (scaffolds)

```
packages/application/identity/src/index.ts   ✅ exists
packages/application/catalog/src/index.ts    ✅ exists
packages/application/inventory/src/index.ts  ✅ exists
packages/application/sales/src/index.ts      ✅ exists
packages/application/purchasing/src/index.ts ✅ exists
packages/application/crm/src/index.ts        ✅ exists
packages/application/sync/src/index.ts       ✅ exists
packages/application/billing/src/index.ts    ✅ exists
```

## packages/infrastructure/mongodb/

```
packages/infrastructure/mongodb/package.json      ✅ exists
packages/infrastructure/mongodb/tsconfig.json     ✅ exists
packages/infrastructure/mongodb/src/mongo-connection.ts      ✅ exists
packages/infrastructure/mongodb/src/encryption.ts            ✅ exists
packages/infrastructure/mongodb/src/migration-runner.ts      ✅ exists
packages/infrastructure/mongodb/src/migration-runner.test.ts ✅ exists
packages/infrastructure/mongodb/migrations/001_initial_schema.ts ✅ exists
packages/infrastructure/mongodb/schemas/companies.schema.json           ✅ exists
packages/infrastructure/mongodb/schemas/users.schema.json               ✅ exists
packages/infrastructure/mongodb/schemas/products.schema.json            ✅ exists
packages/infrastructure/mongodb/schemas/orders.schema.json              ✅ exists
packages/infrastructure/mongodb/schemas/stock_movement_events.schema.json ✅ exists
packages/infrastructure/mongodb/schemas/sync_outbox.schema.json         ✅ exists
packages/infrastructure/mongodb/schemas/audit_entries.schema.json       ✅ exists
```

## packages/infrastructure/backup/

```
packages/infrastructure/backup/package.json           ✅ exists
packages/infrastructure/backup/tsconfig.json          ✅ exists
packages/infrastructure/backup/src/backup-payload.ts  ✅ exists
packages/infrastructure/backup/src/local-disk.adapter.ts       ✅ exists
packages/infrastructure/backup/src/local-disk.adapter.test.ts  ✅ exists
packages/infrastructure/backup/src/supabase-storage.adapter.ts          ✅ exists
packages/infrastructure/backup/src/supabase-storage.adapter.test.ts     ✅ exists
packages/infrastructure/backup/src/backup-queue.ts    ✅ exists
packages/infrastructure/backup/src/backup-queue.test.ts ✅ exists
packages/infrastructure/backup/src/backup-scheduler.ts ✅ exists
packages/infrastructure/backup/src/index.ts            ✅ exists
```

## packages/ui-components/ (scaffold)

```
packages/ui-components/package.json    ✅ exists
packages/ui-components/tsconfig.json   ✅ exists
packages/ui-components/src/index.ts   ✅ exists
packages/ui-components/src/health-screen/HealthScreen.tsx       ✅ exists
packages/ui-components/src/health-screen/HealthScreen.test.tsx  ✅ exists
```

## apps/desktop/ (Tauri + Next.js)

```
apps/desktop/package.json             ✅ exists
apps/desktop/tsconfig.json            ✅ exists
apps/desktop/src-tauri/Cargo.toml     ❌ not yet created
apps/desktop/src-tauri/tauri.conf.json ❌ not yet created
apps/desktop/src-tauri/src/main.rs    ❌ not yet created
apps/desktop/src/main.tsx             ✅ exists
apps/desktop/src/app/App.tsx          ❌ not yet created (app/ folder exists, contents unknown)
apps/desktop/src/bootstrap/di-container.ts  ✅ exists
apps/desktop/src/bootstrap/tauri-bridge.ts  ✅ exists
```

## apps/android/ (Capacitor + Next.js)

```
apps/android/package.json             ❌ not yet created
apps/android/tsconfig.json            ❌ not yet created
apps/android/capacitor.config.ts      ❌ not yet created
apps/android/src/main.tsx             ❌ not yet created
apps/android/src/app/App.tsx          ❌ not yet created
apps/android/src/bootstrap/di-container.ts      ❌ not yet created
apps/android/src/bootstrap/capacitor-bridge.ts  ❌ not yet created
```

## apps/backend/ (Next.js 15 App Router)

```
apps/backend/package.json             ❌ not yet created
apps/backend/tsconfig.json            ❌ not yet created
apps/backend/src/app/api/health/route.ts  ❌ not yet created
apps/backend/src/bootstrap/di-container.ts ❌ not yet created
apps/backend/src/middleware/error-handler.ts ❌ not yet created
apps/backend/src/middleware/request-id.ts    ❌ not yet created
apps/backend/src/middleware/rate-limiter.ts  ❌ not yet created
infra/docker/backend.Dockerfile       ❌ not yet created
infra/docker/docker-compose.yml       ❌ not yet created
```
