# Notifications.md — Smart Retail OS Notification System

**Depends on:** Database.md, Architecture.md §4 (Domain Events as trigger source), API.md, AI.md (advisory alerts)
**Feeds into:** UI_UX.md §1 (notification bell), §3 (approval-pending pattern), §2.7 (Paywall banner), Reports.md §5 (scheduled delivery), Implementation_Pipeline.md Step 26

## 1. Notification Architecture

- A single **Notification Dispatcher** (`apps/backend/src/workers`) subscribes to Domain Events (Architecture.md §4) and to scheduled/AI-job outputs (AI.md §§3–7), and is the only component allowed to create rows in the `notifications` table (§7) or push to an external channel adapter.
- **No feature emits notifications directly** — a Sales command, an AI anomaly job, or a Sync conflict handler all just emit their normal Domain Event or write their normal record (`ai_anomalies`, `sync_conflicts`, etc.); the Dispatcher listens and decides, per the Trigger Catalog (§3), whether/how/to-whom a notification should fire. This keeps notification logic centralized and testable independent of the domain logic that caused it. The same rule applies to the trial/subscription lifecycle (§3) and to Platform Admin actions (§3, §10) — a subscription-status change just gets written; the Dispatcher decides what the tenant sees.
- Channel delivery is implemented as pluggable **Channel Adapters** behind a common interface (`NotificationChannel.send(notification, recipient)`), mirroring the AI Provider abstraction pattern in AI.md §1 — no channel SDK is called directly from application code, and adding a channel (e.g., WhatsApp Business API later) requires no change to trigger logic.
- Offline devices queue outbound notifications (e.g., "sync this alert to other devices/owner") in the same `sync_outbox` mechanism as any other event (Database.md §3.1); locally-relevant notifications (e.g., "stock below reorder point" computed from local data) fire immediately without waiting for connectivity. Trial-countdown notifications (§3) are a deliberate exception: because the trial clock is a server-authoritative timestamp each device already caches (Security.md §6.2), the countdown notification fires locally from that cached value even fully offline, so a trial can't be "extended" by staying disconnected.

## 2. Channels

| Channel                                      | Used For                                                                                                   | Notes                                                                                                      |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| In-app (notification bell + toast)           | All notifications, always, regardless of other channels                                                    | Source of truth list; every notification has an in-app record even if also pushed elsewhere                |
| Push (Android, via Capacitor push plugin)    | High/Critical priority alerts when app is backgrounded                                                     | Requires device push-token registration at login                                                           |
| Desktop tray/system notification             | High/Critical priority alerts when app is backgrounded (Tauri)                                             | Same trigger set as Android push                                                                           |
| Email                                        | Scheduled reports (Reports.md §5), daily/weekly digests, subscription/billing/trial notices                | Default for non-urgent, owner-facing content                                                               |
| SMS / WhatsApp _(Phase 2, per Vision.md §8)_ | Optional critical alerts for owners without reliable in-app access, customer-facing loyalty/promo messages | Deferred; adapter slot reserved in the Channel Adapter interface so no rearchitecture is needed when added |

Every channel adapter implementation lives in `packages/infrastructure` (mirroring `ai-clients`), keeping vendor lock-in at zero per Vision.md §5. Platform Admin security alerts (§10) reuse the same in-app + email adapters but target `platform_admins`, never tenant `notifications` rows (Architecture.md §3.1).

## 3. Trigger Catalog

| Trigger                                                                 | Source Event                                                                           | Default Recipient(s)                   | Default Priority                | Default Channel(s)                                      |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------- | ------------------------------------------------------- |
| Stock below reorder point                                               | Inventory projection crosses `stock_items.reorder_point`                               | Branch Manager, Owner                  | High                            | In-app, Push                                            |
| Stock at zero / stockout                                                | Same projection reaches 0                                                              | Branch Manager, Owner                  | Critical                        | In-app, Push                                            |
| Batch nearing expiry                                                    | Scheduled job scanning `batches.expires_at` (configurable window)                      | Branch Manager                         | Normal                          | In-app                                                  |
| Purchase order pending approval                                         | `PurchaseOrder` created above auto-approve threshold                                   | Approver role for that branch          | High                            | In-app, Push                                            |
| Stock transfer pending approval                                         | `StockTransfer` requested                                                              | Approver role at destination warehouse | High                            | In-app, Push                                            |
| Return pending approval                                                 | `Return` above refund threshold (API.md §4.2)                                          | Approver role                          | High                            | In-app, Push                                            |
| Sync conflict requires manual resolution                                | `sync_conflicts` row created with `resolution_status = pending` after auto-merge fails | Owner / assigned admin                 | High                            | In-app, Push                                            |
| Fraud/anomaly risk score crosses threshold                              | AI fraud job (AI.md §4) writes `ai_anomalies`                                          | Owner                                  | Critical                        | In-app, Push, Email digest                              |
| Dead product detected                                                   | AI dead-product job (AI.md §6)                                                         | Branch Manager, Owner                  | Low                             | In-app (batched)                                        |
| AI prediction ready (nightly forecast)                                  | AI batch job (AI.md §3) completes                                                      | Owner                                  | Low                             | In-app                                                  |
| Store Health sub-score drops significantly                              | Anomaly job (AI.md §7)                                                                 | Owner                                  | High                            | In-app, Push                                            |
| Subscription expiring / grace period active                             | Licensing job (Security.md §6)                                                         | Owner                                  | High → Critical as expiry nears | In-app, Push, Email                                     |
| Device newly registered to company                                      | `devices` insert                                                                       | Owner                                  | Normal                          | In-app, Email                                           |
| Scheduled report ready                                                  | Report worker (Reports.md §5)                                                          | Recipient configured on the schedule   | Low                             | Email (attachment)                                      |
| Employee shift variance over threshold                                  | Shift close event, variance > configured tolerance                                     | Branch Manager, Owner                  | Normal                          | In-app                                                  |
| ETA e-invoice submission failed _(Phase 2)_                             | `eta_invoices.submission_status = failed`                                              | Owner / Accountant                     | High                            | In-app, Email                                           |
| **Trial ending soon (day 10, day 13)**                                  | Scheduled job comparing `now` to `subscriptions.trial_ends_at` (API.md §4.8)           | Owner                                  | High                            | In-app (persistent banner, UI_UX.md §2.7), Push, Email  |
| **Trial ending today**                                                  | Same job, `trialEndsAt` within 24h                                                     | Owner                                  | Critical                        | In-app, Push, Email                                     |
| **Trial expired — account locked**                                      | `subscriptions.status` transitions to `trial_expired` (API.md §4.8)                    | Owner                                  | Critical                        | In-app (persistent Paywall, UI_UX.md §2.7), Push, Email |
| **Plan changed by Platform Admin**                                      | `PATCH /v1/platform-admin/accounts/{id}/plan` (API.md §8.3)                            | Owner                                  | Normal                          | In-app, Email                                           |
| **Account suspended by Platform Admin**                                 | `POST /v1/platform-admin/accounts/{id}/suspend` (API.md §8.3)                          | Owner                                  | Critical                        | In-app (persistent lock screen, UI_UX.md §2.7), Email   |
| **Account reactivated by Platform Admin**                               | `POST /v1/platform-admin/accounts/{id}/reactivate` (API.md §8.3)                       | Owner                                  | High                            | In-app, Push, Email                                     |
| **New device registered to company** _(existing row, cross-referenced)_ | see above                                                                              | Owner                                  | Normal                          | In-app, Email                                           |

This table is the canonical trigger list; a new notification type is not considered implemented until it has a row here (documentation-drift rule, Implementation_Pipeline.md §4).

## 4. Priority Levels & Behavior

| Priority     | In-app behavior                                               | Push/Tray behavior                                                               | Batching                                                  |
| ------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Critical** | Persistent banner + bell badge, does not auto-dismiss         | Immediate push, sound/vibration enabled                                          | Never batched — always sent individually and immediately  |
| **High**     | Bell badge, toast on the active screen                        | Immediate push, no sound override of user's device settings                      | Never batched                                             |
| **Normal**   | Bell badge only                                               | Push only if app has been backgrounded > 30 min (avoids interrupting active use) | Batched into a max-one-per-15-minutes digest per category |
| **Low**      | Bell badge only, grouped under a collapsed "Insights" section | No push                                                                          | Batched into a daily digest                               |

- Priority is a property of the **trigger type** (§3), not user-configurable per notification instance — but the **channel** for a given priority is user-configurable within the bounds of §5.
- Critical and High priority notifications are never suppressed by user preference for safety-relevant categories (stockout, fraud, sync conflict, license/trial expiry, account suspension) — a user can mute the _channel_ (e.g., turn off push) but not the _existence_ of the in-app record, so nothing safety-relevant is ever silently lost. The Trial/Billing category specifically can never be muted at all (not even the channel) once a trial has entered its final 4 days, since silently losing this signal would directly cause an unexpected lockout.

## 5. Notification Preferences

- Configurable per user, per category (grouping the triggers in §3 into: Inventory, Approvals, Sync, AI Insights, Billing & Trial, Reports), per channel — exposed in **Notification Preferences** (UI_UX.md §2.6).
- Preferences apply to Normal/Low priority categories fully; for Critical/High categories, only the _channel_ (push on/off) is configurable, not suppression, per §4.
- Role-based defaults ship out of the box (e.g., Cashier role has no Financial/Approval/Billing category subscriptions by default, since they lack the permission to act on them) but Owners/Managers can adjust. Only the Owner role receives Billing & Trial category notifications by default, since only the Owner can act on `POST /v1/subscription/upgrade` (API.md §4.8).

## 6. Approval-Workflow Notifications

- Directly implements the **Approval-pending pattern** from UI_UX.md §3: the moment an action requiring approval is submitted, the requester's screen shows "Submitted — pending approval" _and_ the Dispatcher fires the corresponding trigger from §3 to the approver — these two things always happen atomically from the same domain event, never one without the other.
- Approval notifications include a deep link that opens the specific pending item (Purchase Order, Transfer, Return, Sync Conflict) directly in its approval screen, not just the general list.

## 7. Data Model

### 7.1 `notifications`

| Column                       | Type      | Notes                                      |
| ---------------------------- | --------- | ------------------------------------------ |
| id                           | UUID PK   |                                            |
| company_id                   | UUID FK   | tenant scope                               |
| recipient_user_id            | UUID FK   |                                            |
| trigger_code                 | TEXT      | maps to §3 catalog                         |
| priority                     | TEXT      | critical/high/normal/low                   |
| title, body                  | TEXT      | rendered in recipient's active language    |
| reference_type, reference_id | TEXT/UUID | deep-link target (e.g., PurchaseOrder, id) |
| is_read                      | BOOLEAN   |                                            |
| created_at                   | TIMESTAMP |                                            |

### 7.2 `notification_deliveries`

id, notification_id (FK), channel, status (queued/sent/failed/delivered), attempted_at, error_detail — one row per channel attempt, so a push failure doesn't hide the fact the in-app record still exists.

### 7.3 `notification_preferences`

user_id, category, channel, is_enabled — composite key, defaults seeded per role at user creation (§5).

Both tables carry the standard audit columns (Database.md §5) and are tenant-scoped by `company_id` like every other table.

## 8. Offline Queuing

- Locally-generated notifications (computed entirely from local data, e.g., stock-below-reorder on a device that hasn't synced in days) are created and shown immediately — no dependency on connectivity.
- Notifications that require cross-device awareness (e.g., "Owner should know Branch B is low on stock" when the Owner is on a different device) are delivered once the underlying Domain Event syncs (Sync Architecture.md) and the Dispatcher on the recipient's own sync path evaluates the trigger — there is no central "notification sync"; notifications are derived locally from synced Domain Events on each device, avoiding a duplicate-delivery race between devices.
- The trial-countdown and trial-expired triggers (§3) are the one category computed from a cached server-authoritative value rather than a purely local read model (§1) — every device independently evaluates its own cached `trialEndsAt` against local device time, so the countdown/lockout notification fires identically on every device without requiring any one device to be "the" source of truth.

## 9. Rate Limiting & Digesting

- Per §4, Normal/Low priority notifications are batched to prevent alert fatigue — directly addressing the same "AI losing trust through noise" risk flagged in AI.md §10, extended here to notifications generally.
- A per-category daily cap (configurable, sane default) prevents a misbehaving rule (e.g., a flapping anomaly threshold) from flooding a user; once the cap is hit, remaining notifications for that category/day are folded into a single "N more Inventory alerts today" summary entry rather than dropped silently. The Billing & Trial category (§5) is exempt from this cap — these are rare, high-consequence events that must never be summarized away.

## 10. Platform Admin Notifications

- A fully separate notification path, targeting `platform_admins` (Security.md §11) rather than tenant `notifications` rows (§7) — never mixed with tenant data, per Architecture.md §3.1's isolation rule.
- Triggers: failed login/MFA lockout on any Platform Admin account (fires to _every other_ active Platform Admin, §API.md §8.1), a plan override/suspension/reactivation performed by any admin (fires to all other admins, as a peer-visibility control against unilateral misuse), and any Platform Admin API rate-limit trip (API.md §6) — all Critical priority, in-app + email, never batched.

---

_Notifications.md — the Dispatcher is the single point where any Domain Event, AI output, scheduled job, or Platform Admin action becomes something a human sees._
