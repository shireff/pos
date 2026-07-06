# Phase 14 — Notifications

## Purpose

Centralized Notification Dispatcher with channel adapters (in-app, push, email), all 25+ triggers from Notifications.md §3 fully wired, priority behavior, per-user notification preferences, rate limiting to prevent floods, and digest batching for low-priority notifications. Trial-countdown behavior is verified via clock simulation (not by waiting real time).

## Scope

- **Dispatcher**: subscribes to all Domain Events via the internal event bus; routes each event to registered notification handlers; applies rate limiting and digest batching before delivery
- **Triggers (25+)**: all triggers from Notifications.md §3 including — trial approaching (days 7, 10, 13), trial expired, account suspended, low stock alert, reorder point reached, stock transfer status changes, purchase order approval requests, return approval requests, shift open/close reminders, cashier absence alerts, large discount applied, payment failed, backup failure, new device registered, discount approval request, credit limit approaching, supplier overdue payment, loyalty tier upgrade
- **Channels**: in-app (persistent notification store in MongoDB), push (Capacitor push on Android via @capacitor/push-notifications, Tauri system tray on Desktop), email (via configured SMTP or Supabase Edge Function)
- **Priority Behavior**: CRITICAL priority (account suspension, trial expired) bypasses rate limits and digests; HIGH priority delivers immediately; MEDIUM priority eligible for hourly digest; LOW priority goes in daily digest
- **Preferences**: per-user channel enablement and frequency preferences stored per notification category
- **Rate Limiting**: daily cap per notification category per user; duplicate suppression within rolling window
- **Clock Simulation**: trial-countdown trigger tests use injected clock — no real-time waiting in CI
- **Atomic Approval Pattern**: approval request notifications link directly to the approval action endpoint — approval completes atomically in the same request as the notification action

## Expected Output

A working notification system where:

- Every domain event in the trigger catalog fires the correct notifications to the correct recipients
- Priority rules are enforced — CRITICAL notifications always deliver even when rate limit is active
- In-app notification bell shows unread count and paginated history
- Push notifications reach Android and Desktop
- Clock simulation test verifies trial countdown without real-time delays
- Atomic approval pattern works for at least PO approval and return approval triggers

## Documents Referenced

- Notifications.md (all sections)
- Event_Catalog.md
- Business_Rules.md §14

## Included Modules

- `packages/domain/notifications/src/aggregates/notification.aggregate.ts`
- `packages/application/notifications/src/dispatcher.ts`
- `packages/application/notifications/src/handlers/*` (one per trigger category)
- `packages/infrastructure/notifications/in-app.channel.ts`
- `packages/infrastructure/notifications/push.channel.ts`
- `packages/infrastructure/notifications/email.channel.ts`
- `packages/infrastructure/mongodb/migrations/014_notifications_schema.ts`
- `apps/backend/src/http/notifications/*`
- `packages/ui-components/src/notifications/NotificationBell.tsx`
- `packages/ui-components/src/notifications/NotificationList.tsx`
- `packages/ui-components/src/notifications/NotificationPreferences.tsx`
- `apps/desktop/src/features/notifications/*`
- `apps/android/src/features/notifications/*`
