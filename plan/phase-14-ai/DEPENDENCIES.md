# Phase 14 — Notifications Dependencies

## Incoming

- Phase 12 (Offline Sync) — cross-device notifications depend on domain events syncing
- Phase 13 (Reports) — scheduled report delivery uses notification channels

## Outgoing

- Phase 15 (AI Services) — AI anomaly and recommendation alerts go through the notification dispatcher

## Documents Used

- Notifications.md (ALL sections — primary document)
- Event_Catalog.md (every event that triggers a notification — §12 NotificationDispatched)
- Business_Rules.md §14 (BR-NOT-001 through BR-NOT-008)
- State_Machines.md §13 (Notification lifecycle)
- Database.md §7.1–7.3 (notifications, notification_deliveries, notification_preferences collections)
- API.md §4.8 (trial/billing triggers)
- UI_UX.md §1 (notification bell), §2.7 (trial countdown banner, paywall)
- Configuration_System.md §12 (notification settings)

## Shared Modules Produced

- `apps/backend/src/workers/notification-dispatcher/` — single centralized dispatcher
- `packages/infrastructure/notifications/` — all channel adapters (in-app, push, email)
- `packages/ui-components/src/notifications/` — notification bell, toast, notification preferences UI
- Trial-countdown trigger logic (shared between dispatcher and client-side self-lock)
