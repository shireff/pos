# Phase 14 — Notifications TODO

## Database

- [ ] Create migration `014_notifications_schema.ts`: notifications (in-app store), notification_preferences, notification_rate_limits, notification_digests collections
- [ ] notifications: index (companyId, recipientUserId, isRead, createdAt)
- [ ] notification_preferences: unique index (userId, notificationCategory)
- [ ] notification_rate_limits: TTL index on windowEndsAt for auto-expiry
- [ ] JSON Schema: notifications requires recipientUserId, category, priority enum(CRITICAL/HIGH/MEDIUM/LOW), title, body, actionUrl optional, isRead boolean

## Dispatcher

- [ ] Implement `NotificationDispatcher` (`packages/application/notifications/src/dispatcher.ts`): subscribes to all domain events from internal event bus; routes each event to registered trigger handlers; passes result through priority rules and rate limiter before channel delivery
- [ ] Implement priority gate: CRITICAL — bypass rate limit and digest; HIGH — deliver immediately, count toward rate limit; MEDIUM — eligible for hourly digest; LOW — daily digest only
- [ ] Implement rate limiter: daily cap per (userId, category); sliding window duplicate suppression; store state in notification_rate_limits

## Trigger Handlers (25+)

- [ ] TrialApproachingDay7Handler, TrialApproachingDay10Handler, TrialApproachingDay13Handler
- [ ] TrialExpiredHandler
- [ ] AccountSuspendedHandler
- [ ] LowStockAlertHandler (fires on ReorderPointReached domain event)
- [ ] StockTransferStatusChangedHandler (pending_approval, approved, shipped, received)
- [ ] PurchaseOrderApprovalRequestHandler
- [ ] PurchaseOrderApprovedHandler, PurchaseOrderRejectedHandler
- [ ] ReturnApprovalRequestHandler
- [ ] ReturnApprovedHandler, ReturnRejectedHandler
- [ ] ShiftOpenReminderHandler, ShiftCloseReminderHandler
- [ ] LargeDiscountAppliedHandler (fires when discount > company threshold)
- [ ] BackupFailureHandler
- [ ] NewDeviceRegisteredHandler
- [ ] DiscountApprovalRequestHandler
- [ ] CreditLimitApproachingHandler (fires when customer credit balance > 80% of limit)
- [ ] SupplierOverduePaymentHandler (fires nightly check)
- [ ] LoyaltyTierUpgradeHandler
- [ ] PriceChangeApprovalRequestHandler
- [ ] AiInsightAvailableHandler

## Channel Implementations

- [ ] In-app channel (`packages/infrastructure/notifications/in-app.channel.ts`): writes notification document to MongoDB; signals connected client via Supabase Realtime or sync engine
- [ ] Push channel (`packages/infrastructure/notifications/push.channel.ts`): Android — @capacitor/push-notifications; Desktop — Tauri tray notification via system notification API; falls back gracefully if permission not granted
- [ ] Email channel (`packages/infrastructure/notifications/email.channel.ts`): sends via configured SMTP or Supabase Edge Function; includes unsubscribe link; respects per-category email preference

## Digest System

- [ ] Hourly digest job: aggregates MEDIUM priority notifications per user into single digest notification
- [ ] Daily digest job: aggregates LOW priority notifications per user
- [ ] Digest formatter: groups by category, shows count per group, links to full list

## Preferences UI

- [ ] `NotificationPreferences.tsx`: per-category toggles for each channel (in-app/push/email), frequency selector (immediate/hourly-digest/daily-digest)
- [ ] Preferences stored in notification_preferences collection, synced as Class B

## Clock Simulation Test

- [ ] `trial-countdown-clock-simulation.test.ts`: inject mock clock into TrialApproachingDay7/10/13 and TrialExpired handlers; advance clock to each trigger point; assert correct notification fired; no real-time waiting

## API Endpoints

- [ ] `GET /v1/notifications` — paginated, unread-first; filter: isRead, category
- [ ] `POST /v1/notifications/:id/read` — mark single as read
- [ ] `POST /v1/notifications/read-all` — mark all as read
- [ ] `GET /v1/notification-preferences` — current user preferences
- [ ] `PUT /v1/notification-preferences` — update preferences

## Atomic Approval Pattern

- [ ] Approval-request notifications (PO, return, discount, price change) include actionUrl pointing to approve/reject endpoint
- [ ] Action resolves atomically via single API call — no separate page navigation required

## Desktop UI

- [ ] `NotificationBell.tsx`: header icon with unread count badge, dropdown showing recent notifications
- [ ] `NotificationList.tsx`: full-page notification history with read/unread filter
- [ ] `NotificationPreferences.tsx`: settings page section

## Android UI

- [ ] Same NotificationBell in header
- [ ] Push notification tap opens relevant action screen

## Tests

- [ ] See TESTS.md

### Quality Gates

- [ ] Zero TypeScript errors
- [ ] All tests passing
- [ ] Update API.md if any endpoint contract was refined during implementation