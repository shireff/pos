# Phase 12 — Offline Sync Files

## Database Migrations & Schemas

```
packages/infrastructure/mongodb/migrations/012_sync_schema.ts
packages/infrastructure/mongodb/schemas/sync_outbox.schema.json
packages/infrastructure/mongodb/schemas/sync_inbox.schema.json
packages/infrastructure/mongodb/schemas/sync_conflicts.schema.json
packages/infrastructure/mongodb/schemas/applied_events_cache.schema.json
```

## Domain — Sync

```
packages/domain/sync/src/value-objects/sync-event.vo.ts
packages/domain/sync/src/entities/sync-conflict.entity.ts
packages/domain/sync/src/entities/sync-conflict.entity.test.ts
packages/domain/sync/src/domain-services/class-a-merge.service.ts
packages/domain/sync/src/domain-services/class-a-merge.service.test.ts
packages/domain/sync/src/domain-services/class-b-merge.service.ts
packages/domain/sync/src/domain-services/class-b-merge.service.test.ts
packages/domain/sync/src/domain-services/hlc-concurrent-detector.service.ts
packages/domain/sync/src/domain-services/hlc-concurrent-detector.service.test.ts
packages/domain/sync/README.md
packages/domain/sync/src/index.ts
```

## Application — Sync Engine

```
packages/application/sync/src/outbox-writer.ts
packages/application/sync/src/outbox-drainer.ts
packages/application/sync/src/inbox-processor.ts
packages/application/sync/src/inbox-processor.test.ts
packages/application/sync/src/idempotency-store.ts
packages/application/sync/src/conflict-recorder.ts
packages/application/sync/src/backlog-paginator.ts
packages/application/sync/src/index.ts
```

## Infrastructure — Sync Transports

```
packages/infrastructure/sync/outbox.repository.ts
packages/infrastructure/sync/inbox.repository.ts
packages/infrastructure/sync/conflict.repository.ts
packages/infrastructure/sync/lan.transport.ts
packages/infrastructure/sync/lan.transport.test.ts
packages/infrastructure/sync/supabase-realtime.transport.ts
packages/infrastructure/sync/supabase-realtime.transport.test.ts
packages/infrastructure/sync/websocket.transport.ts
packages/infrastructure/sync/websocket.transport.test.ts
packages/infrastructure/sync/transport-selector.ts
packages/infrastructure/sync/transport-selector.test.ts
```

## Multi-Device Simulation Harness

```
packages/infrastructure/sync/simulation/sync-simulation-harness.ts
packages/infrastructure/sync/simulation/sync-simulation-harness.test.ts
packages/infrastructure/sync/simulation/scenarios/offline-conflict.scenario.ts
packages/infrastructure/sync/simulation/scenarios/backlog-catchup.scenario.ts
packages/infrastructure/sync/simulation/scenarios/class-a-convergence.scenario.ts
```

## API (Backend)

```
apps/backend/src/http/sync/sync.controller.ts
apps/backend/src/http/sync/sync.controller.test.ts
apps/backend/src/http/sync/sync.schemas.ts
```

## Shared UI Components

```
packages/ui-components/src/sync/SyncStatusIndicator.tsx
packages/ui-components/src/sync/SyncStatusIndicator.test.tsx
packages/ui-components/src/sync/ConflictResolutionPanel.tsx
packages/ui-components/src/sync/ConflictResolutionPanel.test.tsx
packages/ui-components/src/sync/index.ts
```

## Desktop UI

```
apps/desktop/src/features/sync/ConflictListPage.tsx
apps/desktop/src/features/sync/ConflictDetailPage.tsx
```

## Android UI

```
apps/android/src/features/sync/ConflictListPage.tsx
```

## State Management

```
packages/ui-components/src/stores/sync.store.ts
```
