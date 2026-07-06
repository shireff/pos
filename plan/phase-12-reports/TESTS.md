# Phase 12 — Offline Sync Tests

## Unit Tests

### sync/outbox.test.ts

- Local write + outbox append happen in same atomic operation — crash after write always leaves outbox entry
- Outbox entry never expires (persists indefinitely until acknowledged — BR-SYN-008)
- Duplicate change_id on apply is a no-op (idempotent — BR-SYN-006)
- Outbox entry transitions: pending → sent → acknowledged (State_Machines.md §10)

### sync/hlc-merge.test.ts

- Class B: Device A edits field X, Device B edits field Y → both auto-applied (no conflict — BR-SYN-004)
- Class B: Device A edits field X, Device B edits same field X concurrently → conflict queued (BR-SYN-005)
- Class B: Sequential edits (one device saw the other's change) → later HLC wins automatically
- Class B: role/permission field conflict escalates to Owner regardless of branch manager ceiling (BR-PER-006)
- Class B: archived on Device A + edited on Device B → both applied; owner notified (Sync_Architecture.md §5)

### sync/class-a-merge.test.ts

- Class A: Two SALE events from different devices → both applied, projection = sum (never conflicts)
- Class A: Loyalty redemption events from two devices → both applied, balance = correct sum
- Class A: audit_entries never merge — pure append, duplicates by event_id de-duplicated

## Property-Based Tests (MANDATORY)

### sync/commutativity.property.test.ts

- Given N random Class A stock events in random order → final projection is always identical
- Tested across 100+ random orderings per run using fast-check
- Passes for all event types: SALE, RETURN, TRANSFER_OUT, TRANSFER_IN, ADJUSTMENT, PURCHASE_RECEIPT

## Multi-Device Simulation Harness Tests (MANDATORY — built BEFORE conflict logic)

### sync/harness/field-merge-conflict.harness.test.ts

- Scenario: Device A and B both offline. A edits product.price, B edits product.price. Both reconnect. → Conflict queued for Owner
- Scenario: Device A edits product.price, B edits product.description. Both reconnect. → Both auto-applied, no conflict

### sync/harness/inventory-concurrent.harness.test.ts

- Scenario: Device A and B both offline. A sells 5 units, B sells 3 units. Both reconnect. → Both SALE events applied, stock = original - 8

### sync/harness/offline-backlog.harness.test.ts

- Device offline for 2 simulated weeks (1000+ events backlog). Reconnects. → All events applied in correct order via paginated pull

### sync/harness/three-device.harness.test.ts

- Device A, B, C each make conflicting Class B edits while offline. Reconnect in different orders. → Final state is consistent across all three

## Integration Tests

### sync/api.integration.test.ts

- POST /v1/sync/push: events accepted, duplicates (same sequenceNo + deviceId) ignored
- GET /v1/sync/pull?since=X: returns only events after X, paginated
- POST /v1/sync/conflicts/:id/resolve: keeps_local / keeps_remote / merged all work
- Locked account (trial_expired): POST /v1/sync/push returns 403 TRIAL_EXPIRED
- GET /v1/sync/pull: always available even when account locked

### sync/transport.integration.test.ts

- LAN transport: two devices on same subnet discover each other via mDNS, sync without internet
- Supabase Realtime: devices sync via Supabase channel when on different networks
- WebSocket fallback: when Supabase unavailable, falls back to self-hosted WebSocket
- Auto-selection: prefers LAN when available, upgrades to cloud automatically

## E2E Tests (Critical Flows #5 and #6 — MANDATORY exit gate)

### e2e/flow-5-conflict.e2e.test.ts (Critical Flow #5)

- Two devices go offline, each makes conflicting stock adjustments, both reconnect
- Conflict appears in Conflict Review UI with both values shown side-by-side
- Manager resolves conflict → state consistent on both devices

### e2e/flow-6-backlog.e2e.test.ts (Critical Flow #6)

- Device offline for extended period (simulated weeks of data)
- Reconnects → uses paginated pull to catch up
- Memory and time remain bounded during catch-up (no OOM, no timeout)
- All events applied correctly after catch-up completes

## Security Tests

- Device not registered to company cannot sync with any company device (BR-SYN-011)
- All sync traffic over LAN uses encrypted channel (TLS/DTLS)
- Revoked device cannot push or pull after revocation
