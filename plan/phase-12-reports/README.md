# Phase 12 — Offline Sync

## Purpose

Multi-device synchronization engine — outbox/inbox pattern, Class A event-sourced merge for inventory, Class B field-level HLC merge for all other entities, LAN peer-to-peer transport via mDNS, Supabase Realtime cloud relay, WebSocket fallback, conflict detection, and manual conflict resolution UI. This is the highest-risk phase in the project. A dedicated review session is required before this phase is considered complete.

## Scope

- **Core Engine**: outbox (local events queued for push), inbox (remote events queued for apply), idempotent event replay (replay of already-applied events is a no-op), deduplication by eventId
- **Class A Merge**: commutative stock events replayed in any order produce identical stock totals — no conflict possible by construction
- **Class B Merge**: field-level HLC comparison — last-writer-wins per field based on HLC timestamp; concurrent same-field edits produce a detected conflict record
- **Conflict Detection**: concurrent edits (neither has seen the other's HLC) to the same field are captured in sync_conflicts collection for manual review
- **LAN Transport**: mDNS device discovery on local network, direct WebSocket peer channel for zero-latency local sync, no cloud round-trip when devices are on the same LAN
- **Cloud Transport**: Supabase Realtime channel subscription, events published to and consumed from company-scoped channels
- **WebSocket Fallback**: standard WebSocket connection to backend relay when Supabase Realtime is unavailable
- **Auto Transport Selection**: engine selects LAN → Supabase Realtime → WebSocket fallback automatically based on availability
- **Simulation Harness**: multi-device simulation harness MUST be built before any conflict resolution code is written — it drives all scenario validation
- **Conflict Review UI**: shows conflicting field values side-by-side, lets user pick winner, records resolution in audit trail
- **Sync Status Indicator**: persistent UI widget showing last sync timestamp, pending outbox count, and current transport type
- **Tests**: E2E flow #5 (offline conflict scenario), E2E flow #6 (backlog catch-up after extended offline period)

## Expected Output

A working sync engine where:

- All prior phase data (products, inventory, orders, customers) syncs across two devices
- Class A events always converge without conflict
- Class B conflicts are detected and surfaced in the resolution UI
- LAN sync works without internet connectivity
- Supabase Realtime and WebSocket fallback are auto-selected
- E2E flows #5 and #6 pass in CI
- The simulation harness drove development of all conflict scenarios

## Documents Referenced

- Sync Architecture.md (all sections)
- Database.md §3
- API.md §5
- Business_Rules.md §10
- State_Machines.md §10–11
- Testing.md §6

## Included Modules

- `packages/domain/sync` — full implementation (outbox, inbox, conflict domain types)
- `packages/application/sync` — sync engine, merge strategies, transport selector
- `packages/infrastructure/sync/outbox.repository.ts`
- `packages/infrastructure/sync/inbox.repository.ts`
- `packages/infrastructure/sync/lan.transport.ts`
- `packages/infrastructure/sync/supabase-realtime.transport.ts`
- `packages/infrastructure/sync/websocket.transport.ts`
- `packages/infrastructure/sync/transport-selector.ts`
- `packages/infrastructure/sync/conflict.repository.ts`
- `packages/infrastructure/mongodb/migrations/012_sync_schema.ts`
- `packages/ui-components/src/sync/SyncStatusIndicator.tsx`
- `packages/ui-components/src/sync/ConflictResolutionPanel.tsx`
- `apps/desktop/src/features/sync/*`
- `apps/android/src/features/sync/*`
