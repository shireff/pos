# Phase 14 — Notifications Tests

## Unit Tests

### notifications/dispatcher.test.ts

- No feature emits a notification directly — all notifications come through Dispatcher (BR-NOT-001)
- StockMovementRecorded crossing reorder_point threshold → High priority in-app + push notification
- StockMovementRecorded reaching zero → Critical priority notification
- ReturnRequested above threshold → High priority approval notification to approver
- SyncConflictDetected → High priority conflict notification to owner/manager
- SubscriptionTrialExpired → Critical priority paywall notification to owner
- PlatformAdminAccountSuspended → Critical notification to owner (never reveals which admin or why)
- Approval notification and "Submitted — pending approval" state fire atomically from same event (BR-NOT-005)

### notifications/priority.test.ts

- Critical notifications are never batched (always sent immediately and individually)
- High priority notifications are never batched
- Normal priority notifications are batched into max-one-per-15-minutes per category
- Low priority notifications are batched into daily digest
- Billing & Trial category is exempt from daily cap — never summarized (BR-NOT-004)
- Critical/High notifications for safety-relevant categories cannot be suppressed by user preference (BR-NOT-003)

### notifications/trial-countdown.test.ts (clock simulation)

- At trial day 10: trial ending High priority notification fires
- At trial day 13: trial ending Critical priority notification fires
- At trial expiry: trial_expired Critical persistent notification fires
- Trial countdown fires identically on every device from cached trialEndsAt (no central source — BR-NOT-007)
- Device fully offline: trial-countdown still fires from cached value at correct time (BR-LIC-008)

### notifications/preferences.test.ts

- User can mute push channel for Normal/Low categories
- User CANNOT suppress existence of Critical/High safety notifications (only channel is mutable)
- Billing & Trial category CANNOT be muted at all in final 4 days of trial
- Only Owner role receives Billing & Trial notifications by default

## Integration Tests

### notifications/channels.integration.test.ts

- In-app channel: notification row created in notifications collection
- Push channel (Android): Capacitor push plugin called with correct payload
- Push channel (Desktop): Tauri tray notification shown
- Email channel: email sent with correct subject and body
- Channel delivery failure: in-app record still exists (notification_deliveries.status = failed does NOT remove notifications row)

### notifications/offline-queue.integration.test.ts

- Locally-computed notification (stock below reorder): fires immediately without connectivity
- Cross-device notification (owner on different device): fires once underlying Domain Event syncs (BR-NOT-006)
- No central notification sync mechanism — each device evaluates triggers from its own synced events

## E2E Tests

- Complete a sale that drives product below reorder point → High priority notification appears in bell within 5 seconds
- Trial expiry (simulated): Paywall screen appears, notification fires on both Desktop and Android simultaneously
- Approve pending PO → deep-link notification on approver's device opens PO directly
