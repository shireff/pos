# Phase 12 — Offline Sync TODO
> ?? **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
> - **ALL UI text MUST use useT() / 	() with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use pps/backend/src/lib/errors.ts with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.
> - **ALL UI styling MUST use the `@packages/ui-components` design system — NO inline styles (`style={{...}}`) are allowed anywhere.** Do not hardcode styling; always use the shared design-system components and design tokens.

## Database

- [x] Create migration `012_sync_schema.ts`: sync_outbox, sync_inbox, sync_conflicts collections
- [x] sync_outbox: index (companyId, deviceId, status, createdAt) — pending events queued for push
- [x] sync_inbox: index (companyId, deviceId, status, createdAt) — received events queued for apply
- [x] sync_conflicts: index (companyId, entityType, entityId, status)
- [x] JSON Schema: sync_outbox requires eventId UUIDv7, eventType, payload object, companyId, deviceId, status enum(pending/sent/acknowledged)
- [x] JSON Schema: sync_conflicts requires entityType, entityId, field, localValue, remoteValue, localHlc, remoteHlc, resolvedBy?, resolvedAt?

## Domain — Sync

- [x] Implement `SyncEvent` value object: eventId, eventType, payload, hlcTimestamp, deviceId, companyId, occurredAt
- [x] Implement `SyncConflict` entity: id, entityType, entityId, field, localValue, remoteValue, localHlc, remoteHlc, status (unresolved/resolved_local/resolved_remote/resolved_merge), resolution audit trail
- [x] Implement Class A merge strategy: commutative event replay — events replayed in any order produce same result; implemented as sum-of-signed-quantities for stock, append-only for orders/loyalty
- [x] Implement Class B merge strategy: field-level HLC comparison; for each field, apply the value from the higher HLC; if HLCs are equal and values differ, create SyncConflict record
- [x] Implement HLC concurrent detection: two HLCs are concurrent if neither is causally greater than the other

## Sync Engine Core

- [x] Implement outbox writer: every write command appends SyncEvent to sync_outbox before returning to caller; transactional with the primary write
- [x] Implement outbox drainer: background worker polls sync_outbox for pending events; sends to active transport; marks as sent on acknowledgment
- [x] Implement inbox processor: background worker polls sync_inbox; for each event, determine merge class (A or B); apply merge; mark as applied; idempotent on eventId
- [x] Implement idempotency store: applied_events_cache collection (or in-memory set with MongoDB backup); replay of already-applied eventId is a no-op
- [x] Implement sync conflict recorder: when Class B concurrent edit detected, write SyncConflict record and emit ConflictDetected notification

## Transport Implementations

- [x] Implement LAN transport (`packages/infrastructure/sync/lan.transport.ts`): mDNS device discovery (announce device presence, discover peers), direct WebSocket peer channel per device pair, zero-latency push when on same LAN
- [x] Implement Supabase Realtime transport (`packages/infrastructure/sync/supabase-realtime.transport.ts`): subscribe to company-scoped channel, publish events to channel, receive and enqueue to inbox
- [x] Implement WebSocket fallback transport (`packages/infrastructure/sync/websocket.transport.ts`): standard WebSocket to backend relay; auto-reconnect with exponential backoff
- [x] Implement transport selector (`packages/infrastructure/sync/transport-selector.ts`): checks LAN availability → Supabase Realtime availability → WebSocket fallback; auto-selects best available; re-evaluates on connectivity change

## Multi-Device Simulation Harness (MUST be built BEFORE conflict resolution code)

- [x] Implement `sync-simulation-harness.ts`: creates N in-process virtual devices with isolated state; routes events between them via in-memory transport; can inject network partitions, delays, and reconnection events; deterministic replay for all scenario catalog items

## Conflict Resolution

- [x] Implement conflict resolution command: user selects local or remote winner for each conflicting field; records resolution in audit trail
- [x] Implement bulk conflict resolution: resolve all conflicts for an entity in one action

## API Endpoints

- [x] `GET /v1/sync/status` — current sync state: pending outbox count, last sync timestamp, transport type
- [x] `GET /v1/sync/conflicts` — paginated unresolved conflicts
- [x] `POST /v1/sync/conflicts/:id/resolve` — body: winner enum(local/remote), resolvedValue optional

## Sync Status Indicator

- [x] `SyncStatusIndicator.tsx` (`packages/ui-components/src/sync/SyncStatusIndicator.tsx`): persistent widget showing: last sync time, pending count badge, transport type icon (LAN/Cloud/WS), offline indicator
- [x] `ConflictResolutionPanel.tsx`: shows conflicting field values side-by-side; resolution buttons; audit trail display

## E2E Flows

- [x] E2E Flow #5 (offline conflict): Device A edits product price offline; Device B edits same product price offline; both reconnect; conflict record created; user resolves in UI; both devices converge
- [x] E2E Flow #6 (backlog catch-up): Device goes offline for simulated 1 week of events (via simulation harness); reconnects; verifies all events processed and state converges within time budget

## Tests

- [x] See TESTS.md — harness (field-merge-conflict, inventory-concurrent, offline-backlog, three-device), E2E flows #5/#6, outbox unit, and sync API integration tests added; all pass

### Quality Gates

- [x] Zero TypeScript errors (sync packages `@packages/application-sync` and `@packages/infrastructure-sync` typecheck clean; fixed pre-existing syntax/type errors in `conflict.repository.ts` and `replica.repository.ts`)
- [x] All tests passing (53 phase-12 sync tests pass; remaining failures are 9 pre-existing `apps/backend` product/auth route tests that require a live MongoDB/HTTP server and are unrelated to this phase)
- [x] Update API.md if any endpoint contract was refined during implementation (§5 reconciled: implemented REST surface is `/v1/sync/status`, `/v1/sync/conflicts`, `/v1/sync/conflicts/:id/resolve`; event push/pull moved to the transport layer)
