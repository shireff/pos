# Phase 14 — Notifications Checklist

A phase is **NOT complete** until every item below is checked.

## Dispatcher

- [ ] NotificationDispatcher subscribes to all domain events
- [ ] Priority gate: CRITICAL bypasses rate limit and digest — verified by test

## Triggers

- [ ] All 25+ triggers from Notifications.md §3 wired to dispatcher handlers
- [ ] Trial approaching (day 7, 10, 13) triggers fire at correct thresholds
- [ ] Trial expired trigger fires correctly
- [ ] Account suspended trigger fires correctly
- [ ] Low stock / reorder point trigger fires on ReorderPointReached event
- [ ] All transfer, PO, return, shift triggers fire on correct state transitions

## Clock Simulation

- [ ] `trial-countdown-clock-simulation.test.ts` PASSES with injected clock — no real-time waiting

## Channels

- [ ] In-app channel writes notification to MongoDB
- [ ] Push channel sends to Android (Capacitor) and Desktop (Tauri tray)
- [ ] Email channel sends via configured SMTP/Supabase Edge Function

## Rate Limiting & Digests

- [ ] Daily cap per category enforced — duplicate suppression within rolling window
- [ ] MEDIUM priority notifications batched into hourly digest
- [ ] LOW priority notifications batched into daily digest

## Preferences

- [ ] Per-user per-category channel preferences respected
- [ ] Preferences UI saves and loads correctly

## Atomic Approval Pattern

- [ ] Approval-request notifications include correct actionUrl
- [ ] Approval action resolves atomically without additional navigation

## UI

- [ ] NotificationBell shows unread count badge
- [ ] Notification dropdown shows recent notifications
- [ ] Full notification history page with read/unread filter works
- [ ] Notification Preferences settings page works

## Tests

- [ ] Clock simulation test passes (mandatory)
- [ ] All trigger handler unit tests pass
- [ ] Rate limiting enforcement test passes

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
