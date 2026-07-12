# Phase 14 — Notifications TODO

> ⚠️ **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
>
> - **ALL UI text MUST use `useT()` / `t()` with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use `apps/backend/src/lib/errors.ts` with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.
> - **ALL UI styling MUST use the `@packages/ui-components` design system — NO inline styles (`style={{...}}`) are allowed anywhere.** Do not hardcode styling; always use the shared design-system components and design tokens.

## Database

- [x] Create migration `014_notifications_schema.ts`: notifications (in-app store), notification_preferences, notification_rate_limits, notification_digests collections
- [x] notifications: index (companyId, recipientUserId, isRead, createdAt)
- [x] notification_preferences: unique index (userId, notificationCategory)
- [x] notification_rate_limits: TTL index on windowEndsAt for auto-expiry
- [x] JSON Schema: notifications requires recipientUserId, category, priority enum(CRITICAL/HIGH/MEDIUM/LOW), title, body, actionUrl optional, isRead boolean

## Dispatcher

- [x] Implement `NotificationDispatcher` (`packages/application/notifications/src/dispatcher.ts`): subscribes to all domain events from internal event bus; routes each event to registered trigger handlers; passes result through priority rules and rate limiter before channel delivery
- [x] Implement priority gate: CRITICAL — bypass rate limit and digest; HIGH — deliver immediately, count toward rate limit; MEDIUM — eligible for hourly digest; LOW — daily digest only
- [x] Implement rate limiter: daily cap per (userId, category); sliding window duplicate suppression; store state in notification_rate_limits

## Trigger Handlers (25+)

- [x] TrialApproachingDay7Handler, TrialApproachingDay10Handler, TrialApproachingDay13Handler
- [x] TrialExpiredHandler
- [x] AccountSuspendedHandler
- [x] LowStockAlertHandler (fires on ReorderPointReached domain event)
- [x] StockTransferStatusChangedHandler (pending_approval, approved, shipped, received)
- [x] PurchaseOrderApprovalRequestHandler
- [x] PurchaseOrderApprovedHandler, PurchaseOrderRejectedHandler
- [x] ReturnApprovalRequestHandler
- [x] ReturnApprovedHandler, ReturnRejectedHandler
- [x] ShiftOpenReminderHandler, ShiftCloseReminderHandler
- [x] LargeDiscountAppliedHandler (fires when discount > company threshold)
- [x] BackupFailureHandler
- [x] NewDeviceRegisteredHandler
- [x] DiscountApprovalRequestHandler
- [x] CreditLimitApproachingHandler (fires when customer credit balance > 80% of limit)
- [x] SupplierOverduePaymentHandler (fires nightly check)
- [x] LoyaltyTierUpgradeHandler
- [x] PriceChangeApprovalRequestHandler
- [x] AiInsightAvailableHandler

## Channel Implementations

- [x] In-app channel (`packages/infrastructure/notifications/in-app.channel.ts`): writes notification document to MongoDB; signals connected client via Supabase Realtime or sync engine
- [x] Push channel (`packages/infrastructure/notifications/push.channel.ts`): Android — @capacitor/push-notifications; Desktop — Tauri tray notification via system notification API; falls back gracefully if permission not granted
- [x] Email channel (`packages/infrastructure/notifications/email.channel.ts`): sends via configured SMTP or Supabase Edge Function; includes unsubscribe link; respects per-category email preference

## Digest System

- [x] Hourly digest job: aggregates MEDIUM priority notifications per user into single digest notification
- [x] Daily digest job: aggregates LOW priority notifications per user
- [x] Digest formatter: groups by category, shows count per group, links to full list

## Preferences UI

- [x] `NotificationPreferences.tsx`: per-category toggles for each channel (in-app/push/email), frequency selector (immediate/hourly-digest/daily-digest)
- [x] Preferences stored in notification_preferences collection, synced as Class B

## Clock Simulation Test

- [x] `trial-countdown-clock-simulation.test.ts`: inject mock clock into TrialApproachingDay7/10/13 and TrialExpired handlers; advance clock to each trigger point; assert correct notification fired; no real-time waiting

## API Endpoints

- [x] `GET /v1/notifications` — paginated, unread-first; filter: isRead, category
- [x] `POST /v1/notifications/:id/read` — mark single as read
- [x] `POST /v1/notifications/read-all` — mark all as read
- [x] `GET /v1/notification-preferences` — current user preferences
- [x] `PUT /v1/notification-preferences` — update preferences

## Atomic Approval Pattern

- [x] Approval-request notifications (PO, return, discount, price change) include actionUrl pointing to approve/reject endpoint
- [x] Action resolves atomically via single API call — no separate page navigation required

## Desktop UI

- [x] `NotificationBell.tsx`: header icon with unread count badge, dropdown showing recent notifications
- [x] `NotificationList.tsx`: full-page notification history with read/unread filter
- [x] `NotificationPreferences.tsx`: settings page section

## Android UI

- [x] Same NotificationBell in header
- [x] Push notification tap opens relevant action screen

## Tests

- [x] See TESTS.md

### Quality Gates

- [x] Zero TypeScript errors
- [ ] All tests passing — 39/39 notification tests pass; the only failures are 9 pre-existing integration tests in other features (`products`, `auth/login`) that call `getMongoDb()` against the seeded cloud MongoDB Atlas cluster, which is unreachable from this sandbox (no network). They pass wherever a database is reachable. Not part of this phase and not introduced by it.
- [x] Update API.md if any endpoint contract was refined during implementation
