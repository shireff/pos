# Phase 12 — Offline Sync Dependencies

## Incoming

- Phases 01–11 must ALL be complete and producing real domain events to synchronize
- This phase cannot start until all business entities (products, inventory, sales, customers, suppliers, payments, discounts) exist as real Domain Events in the outbox

## Outgoing (CRITICAL — blocks everything downstream)

- Phase 13 (Reports) — cannot build reports on synced data until sync is proven correct
- Phase 14 (Notifications) — cross-device notifications depend on events syncing
- Phase 15 (AI Services) — AI reads from synced read models

## Documents Used

- Sync_Architecture.md (ALL sections — primary document for this phase)
- Database.md §3 (sync collections: sync_outbox, sync_inbox, sync_conflicts, sync_cursors, device_vector_clocks)
- API.md §5 (sync endpoints: push, pull, conflicts, WebSocket stream)
- Business_Rules.md §10 (BR-SYN-001 through BR-SYN-011)
- State_Machines.md §10 (Sync Event lifecycle), §11 (Sync Conflict lifecycle)
- Testing.md §6 (property-based commutativity test, multi-device simulation harness — MANDATORY)
- Event_Catalog.md §9 (SyncBatchPushed, SyncConflictDetected, SyncConflictResolved)
- Security.md §3.2 (TLS for all sync traffic), §6.1 (device registration)

## Critical Rules for This Phase

- Multi-device simulation harness MUST be built BEFORE conflict resolution logic is written
- The harness spins up N simulated devices, applies scripted concurrent operations, executes sync in specified order, asserts convergence
- Every conflict scenario from Sync_Architecture.md §3 has its own harness script
- This phase requires a dedicated review session — not just a PR approval
- A regression introduced in any later phase that touches sync guarantees blocks THAT phase's merge

## Shared Modules Produced

- `packages/infrastructure/sync-engine` — outbox, inbox, transport, conflict-resolver (all sub-packages)
- `packages/infrastructure/sync-engine/transport/lan.transport.ts`
- `packages/infrastructure/sync-engine/transport/supabase-realtime.transport.ts`
- `packages/infrastructure/sync-engine/transport/websocket.transport.ts`
- `packages/infrastructure/sync-engine/conflict-resolver/class-a.resolver.ts`
- `packages/infrastructure/sync-engine/conflict-resolver/class-b.resolver.ts`
- Multi-device simulation test harness — reused in all future sync regression tests
