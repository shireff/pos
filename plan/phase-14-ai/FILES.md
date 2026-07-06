# Phase 14 — Notifications Files

## Database Migrations & Schemas

```
packages/infrastructure/mongodb/migrations/014_notifications_schema.ts
packages/infrastructure/mongodb/schemas/notifications.schema.json
packages/infrastructure/mongodb/schemas/notification_preferences.schema.json
packages/infrastructure/mongodb/schemas/notification_rate_limits.schema.json
packages/infrastructure/mongodb/schemas/notification_digests.schema.json
```

## Domain — Notifications

```
packages/domain/notifications/src/aggregates/notification.aggregate.ts
packages/domain/notifications/src/entities/notification-preference.entity.ts
packages/domain/notifications/src/value-objects/notification-priority.vo.ts
packages/domain/notifications/src/index.ts
```

## Application — Notification Dispatcher & Handlers

```
packages/application/notifications/src/dispatcher.ts
packages/application/notifications/src/dispatcher.test.ts
packages/application/notifications/src/priority-gate.ts
packages/application/notifications/src/rate-limiter.ts
packages/application/notifications/src/rate-limiter.test.ts
packages/application/notifications/src/digest-batcher.ts
packages/application/notifications/src/handlers/trial-approaching.handler.ts
packages/application/notifications/src/handlers/trial-expired.handler.ts
packages/application/notifications/src/handlers/account-suspended.handler.ts
packages/application/notifications/src/handlers/low-stock-alert.handler.ts
packages/application/notifications/src/handlers/stock-transfer-status.handler.ts
packages/application/notifications/src/handlers/po-approval-request.handler.ts
packages/application/notifications/src/handlers/po-approved-rejected.handler.ts
packages/application/notifications/src/handlers/return-approval-request.handler.ts
packages/application/notifications/src/handlers/return-approved-rejected.handler.ts
packages/application/notifications/src/handlers/shift-reminder.handler.ts
packages/application/notifications/src/handlers/large-discount-applied.handler.ts
packages/application/notifications/src/handlers/backup-failure.handler.ts
packages/application/notifications/src/handlers/new-device-registered.handler.ts
packages/application/notifications/src/handlers/discount-approval-request.handler.ts
packages/application/notifications/src/handlers/credit-limit-approaching.handler.ts
packages/application/notifications/src/handlers/supplier-overdue-payment.handler.ts
packages/application/notifications/src/handlers/loyalty-tier-upgrade.handler.ts
packages/application/notifications/src/handlers/price-change-approval.handler.ts
packages/application/notifications/src/scheduled-jobs/hourly-digest.job.ts
packages/application/notifications/src/scheduled-jobs/daily-digest.job.ts
packages/application/notifications/src/scheduled-jobs/supplier-overdue-check.job.ts
packages/application/notifications/src/index.ts
```

## Infrastructure — Notification Channels

```
packages/infrastructure/notifications/in-app.channel.ts
packages/infrastructure/notifications/in-app.channel.test.ts
packages/infrastructure/notifications/push.channel.ts
packages/infrastructure/notifications/email.channel.ts
packages/infrastructure/notifications/notification-channel.interface.ts
```

## Clock Simulation Test

```
packages/application/notifications/src/tests/trial-countdown-clock-simulation.test.ts
```

## API (Backend)

```
apps/backend/src/http/notifications/notifications.controller.ts
apps/backend/src/http/notifications/notifications.controller.test.ts
apps/backend/src/http/notifications/notifications.schemas.ts
apps/backend/src/http/notifications/preferences.controller.ts
```

## Shared UI Components

```
packages/ui-components/src/notifications/NotificationBell.tsx
packages/ui-components/src/notifications/NotificationBell.test.tsx
packages/ui-components/src/notifications/NotificationList.tsx
packages/ui-components/src/notifications/NotificationPreferences.tsx
packages/ui-components/src/notifications/index.ts
```

## Desktop UI

```
apps/desktop/src/features/notifications/NotificationsPage.tsx
apps/desktop/src/features/settings/NotificationPreferencesPage.tsx
```

## Android UI

```
apps/android/src/features/notifications/NotificationsPage.tsx
```

## State Management

```
packages/ui-components/src/stores/notifications.store.ts
```
