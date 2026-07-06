# Phase 12 — Offline Sync Done

> Initially empty. Filled after DEDICATED REVIEW SESSION (not just PR approval) and all items pass.

## Exit Gate Criteria (ALL MANDATORY — strictest gate in the project)

- [ ] Multi-device simulation harness built and passing BEFORE conflict logic was written
- [ ] Property-based commutativity test passes (stock events in any order → same projection)
- [ ] E2E Critical Flow #5 (offline conflict) passes on real Desktop + Android pair
- [ ] E2E Critical Flow #6 (backlog catch-up) passes with large simulated backlog
- [ ] Every conflict scenario from Sync_Architecture.md §3 has a harness test
- [ ] LAN peer-to-peer sync works on same subnet without internet
- [ ] Supabase Realtime relay works across different networks
- [ ] WebSocket fallback works when Supabase unavailable
- [ ] Revoked device cannot sync
- [ ] Locked account sync push returns 403
- [ ] DEDICATED REVIEW SESSION completed (not just PR approval)
- [ ] All CHECKLIST.md items checked
- [ ] All tests passing in CI

## Completion Date

_Not completed yet_

## Review Session Notes

_Document the dedicated review session findings here_
