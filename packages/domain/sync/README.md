# @packages/domain-sync

Pure domain model for the **sync** bounded context (Phase 12 — Offline Sync).

## Layout

- `value-objects/sync-event.vo.ts` — `SyncEvent`, the immutable unit of replication.
- `entities/sync-conflict.entity.ts` — field-level `SyncConflict` with resolution audit trail.
- `entities/index.ts` — `SyncOutboxEntry` / `SyncInboxEntry` (transactional outbox/inbox rows).
- `domain-services/class-a-merge.service.ts` — commutative `Class A` merge (sum of signed
  quantities / append-only), conflict-free by construction.
- `domain-services/class-b-merge.service.ts` — field-level HLC merge for `Class B` entities;
  produces `SyncConflict` records for concurrent same-field edits.
- `domain-services/hlc-concurrent-detector.service.ts` — causal concurrency detection.
- `domain-events/index.ts` — `SyncBatchPushed`, `SyncConflictDetected`, `SyncConflictResolved`.
- `aggregates/index.ts` — `DeviceVectorClock`, `SyncCursor`.

## Merge classes

- **Class A** (inventory stock, loyalty, audit): event-sourced, commutative. Replaying the same
  event set in any order yields an identical projection. Idempotent on `eventId`.
- **Class B** (product/order/supplier headers): per-field HLC comparison. The higher-causality
  HLC wins; concurrent same-field edits with divergent values are surfaced as conflicts.
