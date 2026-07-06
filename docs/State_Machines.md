# State_Machines.md — Smart Retail OS State Machine Catalog

**Depends on:** Database.md, Architecture.md §6 (Event Sourcing scope), Sync_Architecture.md, Security.md §6, API.md §4.8, §8
**Feeds into:** Business_Rules.md (referenced, not re-derived here), Functional_Specification.md (screen-level transition triggers), Testing.md (every transition needs a corresponding test)
**Governing rule:** A state machine below governs a **projected/current status field** on an otherwise possibly event-sourced entity (e.g., `orders.status`, `subscriptions.status`). It never contradicts Architecture.md §6: for Class A (event-sourced) entities, the "state" is a read-model projection over the immutable event log, not a mutable column being overwritten — the diagrams below describe the _allowed projected states and the events that move between them_, not a license to hand-write UPDATE statements against status columns.

## 1. Notation

Diagrams use simple Markdown state-transition tables and ASCII flow. For each entity: **States**, **Transitions** (from → to, triggering action/event, guard condition), and **Invalid Transitions** (explicitly called out so an AI agent doesn't infer them as implicitly permitted).

## 2. Order (Sale)

**States:** `draft` (cart, pre-completion — client-local only, not yet persisted as an Order) → `completed` → `partially_returned` → `fully_returned`. `voided` is a terminal state reachable only from `completed` within the same shift/session per BR-SAL rules.

```
[draft/cart] --complete sale--> [completed] --return (partial)--> [partially_returned]
                                     |                                    |
                                     |--return (full)--> [fully_returned]<-┘ (further partial returns accumulate; full return reached when all lines returned)
                                     |
                                     └--void (same-session only)--> [voided]
```

| From                 | To                   | Trigger                                                    | Guard                                                                    |
| -------------------- | -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `draft`              | `completed`          | `CreateSaleCommand` succeeds                               | Stock sufficient (BR-INV-004), payments sum to grand_total (BR-SAL-003)  |
| `completed`          | `voided`             | `VoidSaleCommand`                                          | Permission `sales.void`; void only allowed same-shift per company policy |
| `completed`          | `partially_returned` | `ProcessReturnCommand` (some lines)                        | Return approved if above threshold (BR-SAL-006)                          |
| `completed`          | `fully_returned`     | `ProcessReturnCommand` (all lines)                         | Same as above                                                            |
| `partially_returned` | `fully_returned`     | Additional `ProcessReturnCommand` covering remaining lines | Same as above                                                            |

**Invalid transitions:** `completed` → `draft` (a completed sale is never reopened as a cart); any transition that edits `order_lines`/`grand_total` in place instead of via a linked Return event (violates BR-SAL-001); `voided` → any other state (terminal).

## 3. Return

**States:** `pending_approval` → `approved` | `rejected`. Terminal: `approved`, `rejected`.

```
[pending_approval] --approve (sales.refund.approve)--> [approved] --triggers RETURN stock event + loyalty reversal-->
[pending_approval] --reject--> [rejected] (no stock/loyalty effect, BR-RET-003)
```

| From               | To                 | Trigger                                             | Guard                                                 |
| ------------------ | ------------------ | --------------------------------------------------- | ----------------------------------------------------- |
| _(created)_        | `pending_approval` | Return submitted above refund threshold             | Mandatory reason captured                             |
| _(created)_        | `approved`         | Return submitted at/below threshold (auto-approved) | Permission `sales.return.create`                      |
| `pending_approval` | `approved`         | Approver action                                     | Permission `sales.refund.approve`                     |
| `pending_approval` | `rejected`         | Approver action                                     | Permission `sales.refund.approve`; reason recommended |

**Invalid transitions:** `approved` → `pending_approval` (no un-approving); `rejected` → `approved` (a rejected return must be resubmitted as a new Return record, never mutated in place, consistent with append-only audit philosophy).

## 4. Purchase Order

**States:** `draft` → `pending_approval` → `approved` → `received` (or `cancelled` from any pre-`received` state).

```
[draft] --submit--> [pending_approval] --approve--> [approved] --goods receipt--> [received]
   |                        |                            |
   └────────────cancel──────┴─────────cancel─────────────┘
                        [cancelled] (terminal)
```

| From               | To                 | Trigger                         | Guard                                                      |
| ------------------ | ------------------ | ------------------------------- | ---------------------------------------------------------- |
| `draft`            | `pending_approval` | PO submitted                    | Above auto-approve threshold (Notifications.md §3)         |
| `draft`            | `approved`         | PO submitted at/below threshold | Permission `purchasing.po.create`                          |
| `pending_approval` | `approved`         | Approver action                 | Permission `purchasing.po.approve`                         |
| `pending_approval` | `cancelled`        | Cancel action                   | Mandatory reason (destructive-action pattern, UI_UX.md §3) |
| `approved`         | `received`         | Goods receipt recorded          | Discrepancy captured explicitly if any (BR-SUP-002)        |
| `approved`         | `cancelled`        | Cancel action                   | Only before any partial receipt                            |

**Invalid transitions:** `received` → any other state (a received PO is closed; corrections happen via a new PO or a stock adjustment event, never by reopening the PO); `cancelled` → any other state (terminal).

## 5. Stock Transfer

**States:** `requested` → `approved` → `shipped` → `received` (or `cancelled` before `shipped`).

```
[requested] --approve (destination warehouse approver)--> [approved] --ship (stock leaves source)--> [shipped] --receive (stock enters destination)--> [received]
    |
    └--cancel--> [cancelled]
```

| From        | To          | Trigger                | Guard                                                                                                      |
| ----------- | ----------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| _(created)_ | `requested` | `TransferStockCommand` | Permission `inventory.transfer.create` at source branch                                                    |
| `requested` | `approved`  | Approval               | Permission `inventory.transfer.approve` at destination warehouse                                           |
| `requested` | `cancelled` | Cancel                 | Before shipment only                                                                                       |
| `approved`  | `shipped`   | Ship action            | Source warehouse projection decrements (BR-INV-011)                                                        |
| `shipped`   | `received`  | Receive action         | Destination warehouse projection increments; discrepancy vs. shipped quantity recorded if any (BR-INV-012) |

**Invalid transitions:** `shipped` → `cancelled` (once stock has left the source, the transfer must be completed via `received`, with any shortfall captured as a receiving discrepancy, not cancelled retroactively); `received` → any other state (terminal, per event-sourced immutability of the underlying stock events).

## 6. Subscription (Trial & Billing Lifecycle)

**States:** `trialing` → `active` | `trial_expired`. `active` → `past_due` → (`active` | `locked`). Any state → `suspended` (Platform Admin only) → `active` (reactivation, restoring prior state). Full-access override is an orthogonal boolean flag, not a state (Database.md §2.16.1), and short-circuits entitlement resolution regardless of the underlying state.

```
[trialing] --14 days elapse, no plan selected--> [trial_expired] --owner selects & pays for a plan--> [active]
[trialing] --owner selects & pays for a plan (before day 14)--> [active]
[active] --payment fails--> [past_due] --grace period expires w/o successful payment--> [locked]
[past_due] --successful payment retry--> [active]
[any state] --Platform Admin suspend--> [suspended] --Platform Admin reactivate--> [prior state restored]
```

| From            | To              | Trigger                                             | Guard                                                             |
| --------------- | --------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `trialing`      | `active`        | `POST /v1/subscription/upgrade` succeeds            | Owner-only (BR-LIC-012)                                           |
| `trialing`      | `trial_expired` | Scheduled job: `trialEndsAt` passed, no plan chosen | Nightly job per Database.md §6 index on `(status, trial_ends_at)` |
| `trial_expired` | `active`        | `POST /v1/subscription/upgrade` succeeds            | Owner-only                                                        |
| `active`        | `past_due`      | Payment retry cycle fails                           | License grace period begins (`license_keys.grace_period_ends_at`) |
| `past_due`      | `active`        | Successful payment retry within grace period        | —                                                                 |
| `past_due`      | `locked`        | Grace period exhausted, no successful payment       | —                                                                 |
| `locked`        | `active`        | Owner completes payment                             | —                                                                 |
| _(any)_         | `suspended`     | `POST /v1/platform-admin/accounts/{id}/suspend`     | Platform Admin only; mandatory reason (BR-XCT-003)                |
| `suspended`     | _(prior state)_ | `POST /v1/platform-admin/accounts/{id}/reactivate`  | Platform Admin only; mandatory reason                             |

**Invalid transitions:** `trial_expired` → `trialing` (a trial never restarts on its own; only a Platform Admin `trial/extend` action can adjust `trialEndsAt`, and that is a field update, not a state re-entry into `trialing`); any tenant-initiated transition into or out of `suspended` (suspension/reactivation is exclusively a Platform Admin action, per Architecture.md §3.1); `locked` → `active` via any path other than a successful payment (no silent auto-unlock).

**Write-lock semantics by state (cross-reference, not a separate machine):** `trialing` and `active` (including `past_due` within grace) = full read/write. `trial_expired`, `locked`, `suspended` = read-only + backup/restore + billing/support screen only (BR-LIC-003). An active full-access override supersedes this table entirely while in effect (BR-LIC-010).

## 7. User (Account Status)

**States:** `active` → `inactive` (deactivated) → `active` (reactivated). `locked_out` is a temporary sub-state reachable from `active` via failed-login/shift-window rules, auto-clearing.

```
[active] --deactivate (users.deactivate)--> [inactive] --reactivate--> [active]
[active] --N failed logins / outside shift window--> [locked_out] --timeout elapses / admin unlock--> [active]
```

| From         | To           | Trigger                                                                | Guard                                                                             |
| ------------ | ------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `active`     | `inactive`   | `DeactivateUserCommand`                                                | Permission `users.deactivate`; scoped to branch ceiling (Permission_Matrix.md §3) |
| `inactive`   | `active`     | Reactivation                                                           | Permission `users.edit`                                                           |
| `active`     | `locked_out` | Failed login/PIN threshold exceeded, or shift-window violation flagged | Security.md §2.2 offline session rules                                            |
| `locked_out` | `active`     | Timeout elapses, or explicit unlock by permitted role                  | —                                                                                 |

**Invalid transitions:** `inactive` → `locked_out` (an inactive user cannot even attempt login, so the lockout sub-state is unreachable from `inactive`); a deactivated user's historical `audit_entries`/`orders` are never deleted or reassigned (BR-XCT-006 soft-delete only).

## 8. Device (Registration & Trust)

**States:** `registered` → `revoked`. A revoked device may be re-registered as a **new** `registered` row rather than transitioning back (Security.md §6.1 treats revocation as terminal for that registration).

```
[registered] --POST /v1/devices/register (fresh credentials)--> [registered] (re-registration = new row)
[registered] --Settings → Device Management remove--> [revoked]
```

| From         | To           | Trigger                     | Guard                                                                             |
| ------------ | ------------ | --------------------------- | --------------------------------------------------------------------------------- |
| _(created)_  | `registered` | `POST /v1/devices/register` | Valid company license/credentials; fires Owner notification (Notifications.md §3) |
| `registered` | `revoked`    | Device removal action       | Permission `devices.manage`/`sync.device.revoke`                                  |

**Invalid transitions:** `revoked` → `registered` (no un-revoking the same registration; local business continuity persists per Security.md §6.1, but sync requires a fresh registration under valid credentials). A revoked device's already-synced data is never retroactively invalidated.

## 9. License / Entitlement (Grace Period)

This is a sub-state of the `active` subscription state (§6), tracked via `license_keys.grace_period_ends_at`, not an independent top-level entity state.

**States:** `valid` (last validation recent) → `stale_within_grace` → `grace_exhausted` (feeds `subscriptions.status = past_due` → `locked` per §6).

```
[valid] --time passes without successful re-validation--> [stale_within_grace] --successful re-validation--> [valid]
[stale_within_grace] --grace_period_ends_at passes--> [grace_exhausted]
```

**Invalid transitions:** `grace_exhausted` cannot silently revert to `valid` without an explicit successful payment/validation event — there is no passive recovery.

## 10. Sync Event (Outbox/Inbox Lifecycle)

**States (per event, `sync_outbox`):** `pending` → `sent` → `acknowledged`. **States (`sync_inbox`):** `pending` → `applied` | `conflict`.

```
Outbox:  [pending] --transport delivers--> [sent] --peer/server ack--> [acknowledged]
Inbox:   [pending] --apply succeeds (no conflict)--> [applied]
         [pending] --apply detects irreconcilable same-field concurrent edit--> [conflict]
```

| From               | To             | Trigger                                 | Guard                                                     |
| ------------------ | -------------- | --------------------------------------- | --------------------------------------------------------- |
| `pending` (outbox) | `sent`         | Transport (LAN or cloud) delivers batch | —                                                         |
| `sent`             | `acknowledged` | Peer/server confirms receipt            | Idempotent by `change_id` (BR-SYN-006)                    |
| `pending` (inbox)  | `applied`      | Event applied to local store            | Event-sourced (auto-merge) or Class B non-contested field |
| `pending` (inbox)  | `conflict`     | Same-field concurrent edit detected     | Creates a `sync_conflicts` row                            |

**Invalid transitions:** `acknowledged` → `pending` (no un-sending; a change never expires or resets, per BR-SYN-008); `applied` → `conflict` retroactively (once applied, a Class A event is never revisited as a conflict — by construction, Class A events cannot conflict, per BR-SYN-002).

## 11. Sync Conflict

**States:** `pending` → `auto_resolved` | `manual_resolved`.

```
[pending] --deterministic HLC resolution possible--> [auto_resolved]
[pending] --Branch Manager/Owner picks or merges--> [manual_resolved]
```

| From        | To                | Trigger                                                                                                            | Guard                                                      |
| ----------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| _(created)_ | `pending`         | Concurrent same-field edit detected, no causal order derivable                                                     | Notification fired (Notifications.md §3)                   |
| `pending`   | `auto_resolved`   | System resolves deterministically (rare — most auto-resolvable cases never reach `pending` at all, per BR-SYN-004) | —                                                          |
| `pending`   | `manual_resolved` | `POST /v1/sync/conflicts/{id}/resolve`                                                                             | Role/permission-field conflicts require Owner (BR-PER-006) |

**Invalid transitions:** `auto_resolved`/`manual_resolved` → `pending` (resolution is terminal per record; a subsequent edit to the same field creates a new, independent conflict record if it recurs).

## 12. Backup Job

**States:** `scheduled` → `running` → `completed` | `failed`. `completed` → `verified` | `verification_failed`.

```
[scheduled] --cron/manual trigger--> [running] --success--> [completed] --integrity check--> [verified]
                                          |                                        |
                                          └--error--> [failed]                     └--checksum mismatch--> [verification_failed]
```

| From        | To                    | Trigger                                                | Guard                                              |
| ----------- | --------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| `scheduled` | `running`             | Daily cron or manual trigger (`backup.trigger_manual`) | —                                                  |
| `running`   | `completed`           | Backup file written successfully                       | —                                                  |
| `running`   | `failed`              | I/O or encryption error                                | Owner-facing plain-language error (Security.md §8) |
| `completed` | `verified`            | Checksum matches                                       | —                                                  |
| `completed` | `verification_failed` | Checksum mismatch                                      | Restore is blocked from this backup (BR-BAK-003)   |

**Invalid transitions:** `verification_failed` → `verified` (a corrupted backup is never retroactively trusted; a new backup run is required); restore can only be initiated from a `verified` backup.

## 13. Notification

**States:** `queued` → `sent` → `delivered` | `failed` (per `notification_deliveries` row, one per channel attempt). The parent `notifications` row itself has only `is_read: false → true`.

```
[queued] --dispatcher processes--> [sent] --channel confirms--> [delivered]
                                        └--channel error--> [failed] (in-app record still exists per Notifications.md §4)
[unread] --user views--> [read]
```

| From     | To          | Trigger                                   | Guard                                            |
| -------- | ----------- | ----------------------------------------- | ------------------------------------------------ |
| `queued` | `sent`      | Dispatcher hands off to a Channel Adapter | —                                                |
| `sent`   | `delivered` | Channel confirms                          | —                                                |
| `sent`   | `failed`    | Channel adapter error                     | In-app record unaffected (Notifications.md §7.2) |
| `unread` | `read`      | User views the notification               | —                                                |

**Invalid transitions:** A `failed` channel delivery never removes or hides the underlying `notifications` row — the in-app record is the source of truth regardless of any channel's delivery outcome (Notifications.md §2).

## 14. OCR Job (Supplier Invoice)

**States:** `uploaded` → `extracting` → `extracted` → `reviewed` → `confirmed` | `discarded`.

```
[uploaded] --OCR pipeline starts--> [extracting] --fields extracted--> [extracted] --shown as editable form--> [reviewed] --user confirms--> [confirmed]
                                                                                                     └--user discards--> [discarded]
```

| From         | To           | Trigger                                             | Guard                                                                              |
| ------------ | ------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| _(upload)_   | `uploaded`   | `POST /v1/supplier-invoices/ocr`                    | Image received                                                                     |
| `uploaded`   | `extracting` | Pipeline begins OCR + LLM-assisted field extraction | —                                                                                  |
| `extracting` | `extracted`  | Structured fields produced against strict schema    | Schema validation passes (else retry per AI.md §2 pattern)                         |
| `extracted`  | `reviewed`   | Purchasing Officer opens the pre-filled form        | Every field remains user-editable (BR-SUP-003)                                     |
| `reviewed`   | `confirmed`  | User confirms                                       | Creates the actual `supplier_invoices` record; correction data logged (BR-SUP-004) |
| `reviewed`   | `discarded`  | User discards                                       | No record created                                                                  |

**Invalid transitions:** `extracted` → `confirmed` directly (a human review/edit step is mandatory — never auto-committed, per AI.md §5); `confirmed` → any other state (terminal; a correction after confirmation is a new supplier-invoice edit through the normal Class B flow, not a reopening of the OCR job).

## 15. AI Request (Assistant / Recommendation Generation)

**States:** `classified` → `routed` → `completed` | `failed_fallback` | `failed_final`.

```
[classified] --routing policy (AI.md §1)--> [routed] --provider responds, schema valid--> [completed]
                                                  |
                                                   └--provider fails/times out--> [failed_fallback] --next model in whitelist--> [routed] (retry)
                                                                                        |
                                                                                        └--all models exhausted--> [failed_final] (graceful degradation message)
```

| From               | To                | Trigger                         | Guard                                                      |
| ------------------ | ----------------- | ------------------------------- | ---------------------------------------------------------- |
| _(query received)_ | `classified`      | Local heuristic classification  | No cloud call needed (AI.md §2)                            |
| `classified`       | `routed`          | Routing policy selects model    | Offline/simple → local; complex/online → NaraRouter        |
| `routed`           | `completed`       | Response received, schema-valid | Tagged `source` field set (BR-AI-007)                      |
| `routed`           | `failed_fallback` | Model timeout/error             | Falls back within NaraRouter whitelist models (BR-AI-007)  |
| `failed_fallback`  | `routed`          | Next model attempted            | —                                                          |
| `failed_fallback`  | `failed_final`    | All models exhausted            | Graceful "couldn't compute that" message shown (BR-AI-006) |

**Invalid transitions:** `completed` → `routed` (a completed response is not silently re-routed after the fact); a malformed response is never surfaced directly to the user in any state — it must pass through the one-retry-then-fallback path (BR-AI-006).

## 16. AI Recommendation (Advisory Lifecycle)

**States:** `generated` → `presented` → `accepted` | `rejected` | `expired`.

```
[generated] --surfaced on dashboard/insight panel--> [presented] --owner accepts--> [accepted] (triggers the normal manual command, e.g., UpdatePriceCommand)
                                                            |
                                                            ├--owner rejects--> [rejected]
                                                            └--time window elapses with no action--> [expired]
```

| From           | To          | Trigger                                                             | Guard                                                                                                               |
| -------------- | ----------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| _(job output)_ | `generated` | Nightly/scheduled AI job writes `ai_predictions`/`ai_anomalies` row | Deterministic core computation (BR-AI-002/003)                                                                      |
| `generated`    | `presented` | Shown in UI (dashboard, insight panel)                              | —                                                                                                                   |
| `presented`    | `accepted`  | Owner/permitted role clicks Accept                                  | Writes `ai_insight_feedback`; triggers the real domain command identical to a manual action (BR-AI-001, BR-PRC-005) |
| `presented`    | `rejected`  | Owner/permitted role clicks Dismiss                                 | Writes `ai_insight_feedback`                                                                                        |
| `presented`    | `expired`   | Configured validity window elapses                                  | No feedback record; excluded from acceptance-rate denominator per evaluation methodology                            |

**Invalid transitions:** `generated` → `accepted` directly (a recommendation must be `presented` — i.e., actually shown to a human — before it can be accepted; there is no code path from raw AI output straight to an applied change, per BR-AI-001).

---

_State_Machines.md — every transition table above corresponds to at least one E2E or unit test in Testing.md; a transition with no corresponding test is not considered implemented, matching the same standard Business_Rules.md sets for business rules generally._
