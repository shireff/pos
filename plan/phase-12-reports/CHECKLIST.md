# Phase 12 — Offline Sync Checklist

A phase is **NOT complete** until every item below is checked.

## Pre-Conditions

- [ ] **Multi-device simulation harness is BUILT AND PASSING before any conflict resolution code was written** — verified by commit order in git history

## Core Engine

- [ ] Outbox writer appends SyncEvent atomically with primary write
- [ ] Inbox processor is idempotent on eventId (replay of applied event is no-op)
- [ ] Class A merge (commutative stock events): replay in any order produces identical stock totals
- [ ] Class B merge: field-level HLC comparison applied correctly per field
- [ ] Concurrent same-field edits produce SyncConflict record — verified by simulation harness

## Transport

- [ ] LAN transport: mDNS discovery finds devices on same local network
- [ ] LAN transport: direct WebSocket channel delivers events without cloud round-trip
- [ ] Supabase Realtime transport: events published and received on company-scoped channel
- [ ] WebSocket fallback transport: connects to backend relay, auto-reconnects
- [ ] Auto transport selector: promotes LAN → Supabase Realtime → WebSocket based on availability

## Conflict Resolution

- [ ] Conflict review UI shows local and remote values side-by-side
- [ ] Conflict resolution records winner in audit trail
- [ ] After resolution, both devices converge to same state

## UI

- [ ] SyncStatusIndicator shows last sync time, pending count, and transport type
- [ ] Sync status indicator updates in real time without page refresh

## **E2E Flows — MANDATORY EXIT GATES**

- [ ] E2E Flow #5 PASSES: offline conflict → detected → resolved in UI → both devices converge
- [ ] E2E Flow #6 PASSES: 1-week backlog catch-up via simulation harness within time budget

## Full Conflict Scenario Catalog

- [ ] All scenarios from Sync Architecture.md verified by simulation harness

## **DEDICATED REVIEW SESSION REQUIRED**

- [ ] A dedicated review session (not just a PR approval) must be scheduled and completed before this phase is considered done

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
