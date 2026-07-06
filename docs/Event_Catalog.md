# Event_Catalog.md — Smart Retail OS Domain Event Catalog

**Depends on:** Architecture.md §3 (Bounded Contexts), §4 (CQRS), §6 (Event Sourcing), Sync_Architecture.md, Database.md, Notifications.md, AI.md
**Feeds into:** Notifications.md §3 Trigger Catalog (every trigger there is sourced from an event below), Reports.md §1 (projection worker consumes these), Testing.md §6 (sync/idempotency tests reference these events)
**Governing rule:** Every Domain Event is named `<Noun><PastTenseVerb>` (Coding_Standards.md §4). Class A events (Architecture.md §6: Inventory, Sync) are immutable and append-only by construction; Class B events represent a field-merge change record, not a full entity snapshot, per Sync_Architecture.md §3.2. An event with no consumer is a design smell and should be questioned, not assumed intentional.

## 1. How to Read This Catalog

For each event: **Description**, **Producer** (Bounded Context/Command), **Consumers**, **Payload** (representative fields), **Trigger**, **Offline Behavior**, **Sync Behavior**, **Failure Handling**, **Idempotency**, **Priority** (maps to Notifications.md §4 where a notification results). Priority is listed only where the event feeds a notification; purely internal events (e.g., read-model projection triggers) have no notification priority and are marked "N/A."

## 2. Identity & Access Context

### UserAuthenticated

- **Description:** A user successfully completed login (online or offline PIN check).
- **Producer:** `LoginCommand` / offline PIN validation (Security.md §2).
- **Consumers:** Audit Log writer, session manager.
- **Payload:** `{ userId, companyId, deviceId, authMethod: "online"|"offline_pin", occurredAt }`.
- **Trigger:** Successful credential/PIN validation.
- **Offline behavior:** Fires locally for offline PIN logins; queued for sync like any other audit event.
- **Sync behavior:** Append-only sync to `audit_entries`; no conflict possible.
- **Failure handling:** N/A (this event only fires on success; failures produce `UserLoginFailed`).
- **Idempotency:** `change_id` per event; duplicate application is a no-op.
- **Priority:** N/A (audit only).

### UserLoginFailed

- **Description:** A login/PIN attempt failed.
- **Producer:** `LoginCommand` failure path.
- **Consumers:** Audit Log writer, account lockout counter (Security.md §2.2), fraud anomaly signal (AI.md §4, indirectly via aggregate patterns).
- **Payload:** `{ userId (if resolvable), companyId, deviceId, reason, occurredAt }`.
- **Trigger:** Invalid credential/PIN, or shift-window violation.
- **Offline behavior:** Fires locally; contributes to local lockout counter without needing connectivity (Security.md §2.2).
- **Sync behavior:** Append-only.
- **Failure handling:** N/A.
- **Idempotency:** `change_id` per attempt.
- **Priority:** N/A (audit-only; repeated failures may separately feed fraud scoring).

### PermissionRoleChanged

- **Description:** A role's permission set, or a user's branch-role assignment, changed.
- **Producer:** `UpdateRolePermissionsCommand` / `AssignBranchRoleCommand`.
- **Consumers:** Audit Log writer, session/permission cache invalidation.
- **Payload:** `{ roleId or userBranchRoleId, before_json, after_json, actingUserId, occurredAt }`.
- **Trigger:** Owner/Company Administrator edits a role or assignment.
- **Offline behavior:** Recorded locally; effective immediately on the originating device.
- **Sync behavior:** Class B field-merge; same-field concurrent conflicts on role/permission escalate directly to Owner (Sync_Architecture.md §5, BR-PER-006).
- **Failure handling:** Rejected if it would grant a Platform Administration capability (Architecture.md §3.1) — structurally impossible, not merely validated.
- **Idempotency:** `change_id`.
- **Priority:** N/A (audit-only; visible in Audit Log Viewer).

### DeviceRegistered

- **Description:** A new device was bound to a company's license.
- **Producer:** `RegisterDeviceCommand` (Security.md §6.1).
- **Consumers:** Notification Dispatcher, Audit Log writer.
- **Payload:** `{ deviceId, companyId, deviceType, deviceFingerprint, registeredAt }`.
- **Trigger:** `POST /v1/devices/register`.
- **Offline behavior:** Registration itself requires connectivity (it's a server-issued binding); not offline-capable.
- **Sync behavior:** Propagates to all devices via the sync stream so every device is aware of the company's device roster.
- **Failure handling:** Rejected if license/credentials invalid.
- **Idempotency:** Unique per `deviceFingerprint`.
- **Priority:** Normal (Notifications.md §3 "Device newly registered").

### DeviceRevoked

- **Description:** A device's sync credentials were revoked.
- **Producer:** `RevokeDeviceCommand`.
- **Consumers:** Sync engine (rejects further pushes from that device), Audit Log writer.
- **Payload:** `{ deviceId, companyId, revokedByUserId, occurredAt }`.
- **Trigger:** Settings → Device Management removal (Security.md §6.1).
- **Offline behavior:** The revoked device continues full local operation but can no longer sync (Security.md §6.1).
- **Sync behavior:** Propagated so all peers/backend reject further events from the revoked device ID.
- **Failure handling:** N/A.
- **Idempotency:** Idempotent per `deviceId`.
- **Priority:** N/A (audit-only, though could be surfaced as informational).

## 3. Catalog & Inventory Context

### ProductCreated / ProductUpdated / ProductArchived

- **Description:** Lifecycle events for a Product/Variant.
- **Producer:** `CreateProductCommand` / `UpdateProductCommand` / `ArchiveProductCommand`.
- **Consumers:** Read-model projector (Product List, Reports), Sync engine, Audit Log writer.
- **Payload:** `{ productId, companyId, fields changed (per-field HLC), occurredAt }`.
- **Trigger:** Catalog management actions.
- **Offline behavior:** Fully offline-capable; local write completes immediately (BR-SYN-001).
- **Sync behavior:** Class B field-merge; `ProductArchived` is itself a field change (`archived_at`) subject to the same merge rule, so archive-vs-edit conflicts resolve per Sync_Architecture.md §5 (both apply).
- **Failure handling:** Validation errors surfaced as `Result<T, DomainError>` (Coding_Standards.md §5), never a thrown exception for expected failures.
- **Idempotency:** `change_id` per field-change diff.
- **Priority:** N/A.

### StockMovementRecorded

- **Description:** The single canonical event type for every stock-affecting action (Class A). `event_type` discriminates SALE/RETURN/TRANSFER_OUT/TRANSFER_IN/ADJUSTMENT/PURCHASE_RECEIPT.
- **Producer:** Any command that affects stock: `CreateSaleCommand`, `ProcessReturnCommand`, `ShipTransferCommand`, `ReceiveTransferCommand`, `AdjustStockCommand`, `ReceivePurchaseOrderCommand`.
- **Consumers:** Stock projection worker (`stock_items.quantity_on_hand`), Reports read-model projector, AI anomaly detection (AI.md §4), Sync engine.
- **Payload:** `{ id (UUIDv7), warehouseId, productVariantId, batchId, eventType, quantityDelta, occurredAt, originatingDeviceId, sequenceNo, causalityVector, referenceType, referenceId }` (Database.md §2.8).
- **Trigger:** Any of the commands listed above.
- **Offline behavior:** Fully offline-capable and the canonical example of Class A design — completes locally, never blocked by connectivity (BR-INV-001, BR-SYN-001).
- **Sync behavior:** Pure event replay; commutative, never conflicts by construction (BR-SYN-002, BR-INV-014). Order of arrival across devices does not affect the final projected total.
- **Failure handling:** A correction is a new opposite-signed event referencing the original (BR-INV-002) — the original event is never edited or deleted; enforced by a database trigger forbidding UPDATE/DELETE (Database.md §7).
- **Idempotency:** Deduplicated by `(originating_device_id, sequence_no)` on replay (BR-SYN-006, API.md §5.1).
- **Priority:** Indirectly feeds "Stock below reorder point" (High) and "Stock at zero" (Critical) notifications once the resulting projection crosses a threshold (Notifications.md §3).

### StockTransferRequested / StockTransferApproved / StockTransferShipped / StockTransferReceived / StockTransferCancelled

- **Description:** Lifecycle events for the Stock Transfer state machine (State_Machines.md §5).
- **Producer:** Corresponding transfer lifecycle commands.
- **Consumers:** Notification Dispatcher (pending-approval trigger), stock projection worker (Shipped/Received legs emit corresponding `StockMovementRecorded` events), Audit Log writer.
- **Payload:** `{ transferId, fromWarehouseId, toWarehouseId, lines[], status, actingUserId, occurredAt }`.
- **Trigger:** Each named lifecycle action.
- **Offline behavior:** Fully offline-capable at every step; a transfer created offline at one branch reconciles once both devices sync.
- **Sync behavior:** Header (`StockTransfer`) is Class B; the resulting stock movements at ship/receive are Class A. A transfer status conflict (e.g., simultaneous approve+cancel) is a Class B same-field conflict, escalated per Sync_Architecture.md §5.
- **Failure handling:** `StockTransferReceived` explicitly captures a quantity discrepancy vs. shipped rather than silently reconciling (BR-INV-012).
- **Idempotency:** `change_id` per lifecycle transition.
- **Priority:** High (Notifications.md §3 "Stock transfer pending approval").

## 4. Sales Context

### OrderCompleted

- **Description:** A sale was completed at the point of sale.
- **Producer:** `CreateSaleCommand` (Coding_Standards.md §4 naming pattern).
- **Consumers:** Stock projection worker (emits linked `StockMovementRecorded` events per line, including bundle component deductions), Reports projector, Loyalty accrual processor, Receipt/Hardware layer, Fraud anomaly scoring (AI.md §4), Notification Dispatcher (indirectly, via downstream low-stock triggers).
- **Payload:** `{ orderId, branchId, cashierId, customerId (nullable), lines[], payments[], subtotal, discountTotal, taxTotal, grandTotal, clientTxnId, occurredAt }` (API.md §4.2, Database.md §2.10).
- **Trigger:** `POST /v1/orders` / local `CreateSaleCommand` execution.
- **Offline behavior:** The canonical "never blocked" flow — completes fully offline, receipt falls back to digital if printer unavailable (BR-SAL-008).
- **Sync behavior:** Class A (append-only, event-sourced per Sync_Architecture.md §3.3); a sale is never edited, only followed by linked Return events.
- **Failure handling:** `STOCK_INSUFFICIENT` / `BUSINESS_RULE_VIOLATION` (expired batch) returned as `Result` failures pre-commit, never a partial order.
- **Idempotency:** `clientTxnId` makes replay idempotent (API.md §4.2, BR-SAL-004).
- **Priority:** N/A directly; large-discount or high-value transactions may separately feed fraud/anomaly triggers.

### OrderVoided

- **Description:** A completed sale was voided within the same session/shift.
- **Producer:** `VoidSaleCommand`.
- **Consumers:** Stock projection (reverses the sale's stock effect via a linked event), Audit Log writer, Fraud anomaly scoring (void-rate signal, AI.md §4).
- **Payload:** `{ orderId, voidedByUserId, reason, occurredAt }`.
- **Trigger:** Cashier/manager void action.
- **Offline behavior:** Fully offline-capable.
- **Sync behavior:** Class A linked correction event.
- **Failure handling:** Rejected if outside the void-eligible window per company policy.
- **Idempotency:** `change_id`.
- **Priority:** N/A (feeds Employee Performance void-rate KPI, Reports.md §3).

### ReturnRequested / ReturnApproved / ReturnRejected

- **Description:** Lifecycle events for the Return state machine (State_Machines.md §3).
- **Producer:** `ProcessReturnCommand` / approval commands.
- **Consumers:** Stock projection (approved return emits a `StockMovementRecorded` RETURN event), Loyalty point reversal processor (BR-SAL-007), Notification Dispatcher, Audit Log writer.
- **Payload:** `{ returnId, originalOrderId, lines[], reason, refundMethod, status, occurredAt }`.
- **Trigger:** Return creation and approval-workflow actions.
- **Offline behavior:** Fully offline-capable; approval may be deferred until an approver's device syncs if the approver isn't on the originating device.
- **Sync behavior:** Return record itself is Class A (append-only per Sync_Architecture.md §3.3); status field transitions are captured as linked events, not in-place edits.
- **Failure handling:** `ReturnRejected` produces no stock/loyalty effect (BR-RET-003).
- **Idempotency:** `change_id` per event.
- **Priority:** High (Notifications.md §3 "Return pending approval").

### CashDrawerOpened / CashDrawerSessionClosed

- **Description:** Drawer session lifecycle including no-sale opens.
- **Producer:** `OpenDrawerCommand` (triggered by cash sale or manager no-sale action), `CloseShiftCommand`.
- **Consumers:** Fraud anomaly scoring (drawer-open-without-sale signal, AI.md §4), Reports (shift reconciliation), Audit Log writer.
- **Payload:** `{ drawerSessionId, branchId, cashierId, trigger: "sale"|"manager_no_sale", openingFloat, closingCount, occurredAt }`.
- **Trigger:** Sale completion, manager action, or shift close.
- **Offline behavior:** Fully offline-capable; shift close never blocked by pending sync (BR-SAL-009).
- **Sync behavior:** Class A (event-sourced, Sync_Architecture.md §3.3).
- **Failure handling:** Drawer hardware failure never blocks the underlying sale/session event (BR-SAL-011).
- **Idempotency:** `change_id`.
- **Priority:** N/A directly (manager no-sale opens are always logged/audited per BR-SAL-012).

## 5. Purchasing Context

### PurchaseOrderCreated / PurchaseOrderApproved / PurchaseOrderReceived / PurchaseOrderCancelled

- **Description:** Lifecycle events for the Purchase Order state machine (State_Machines.md §4).
- **Producer:** Corresponding PO lifecycle commands.
- **Consumers:** Notification Dispatcher (pending-approval trigger), stock projection (Received emits `StockMovementRecorded` PURCHASE_RECEIPT events), Supplier performance calculator (AI.md §3, Reports.md §2.10), Audit Log writer.
- **Payload:** `{ poId, supplierId, lines[], status, actingUserId, occurredAt }`.
- **Trigger:** PO lifecycle actions.
- **Offline behavior:** Fully offline-capable.
- **Sync behavior:** Header is Class B; goods-receipt line events are Class A.
- **Failure handling:** A receiving discrepancy is captured explicitly (BR-SUP-002), never silently reconciled.
- **Idempotency:** `change_id` per transition.
- **Priority:** High (Notifications.md §3 "Purchase order pending approval").

### SupplierInvoiceOCRSubmitted / SupplierInvoiceOCRExtracted / SupplierInvoiceConfirmed

- **Description:** OCR pipeline lifecycle (State_Machines.md §14).
- **Producer:** `POST /v1/supplier-invoices/ocr` upload, OCR pipeline completion, user confirmation.
- **Consumers:** Purchasing use cases (creates the real `supplier_invoices` record only on confirmation), AI feedback-loop logger (BR-SUP-004).
- **Payload:** `{ ocrJobId, imageRef, extractedFields (pre-confirmation), confirmedFields (post-confirmation), correctionsDiff, occurredAt }`.
- **Trigger:** Invoice image upload and subsequent review actions.
- **Offline behavior:** Upload/OCR requires connectivity to the AI Gateway's cloud path unless a local model handles simple cases (AI.md §1); the review/confirm step itself is a local action.
- **Sync behavior:** Confirmed invoice becomes a normal Class B `supplier_invoices` record.
- **Failure handling:** Schema-invalid OCR extraction triggers one retry then a fallback message (BR-AI-006); never auto-committed (BR-SUP-003).
- **Idempotency:** `ocrJobId` unique per upload.
- **Priority:** N/A (a completed extraction is a UI event, not typically a push notification).

## 6. CRM Context

### CustomerCreated / CustomerUpdated

- **Description:** Customer profile lifecycle.
- **Producer:** `CreateCustomerCommand` / `UpdateCustomerCommand`.
- **Consumers:** Reports projector, AI segmentation job (AI.md §8), Sync engine.
- **Payload:** `{ customerId, name, phone, loyaltyCode, fields changed, occurredAt }`.
- **Trigger:** Customer management actions.
- **Offline behavior:** Fully offline-capable.
- **Sync behavior:** Class B field-merge.
- **Failure handling:** Standard validation `Result` failures.
- **Idempotency:** `change_id`.
- **Priority:** N/A.

### LoyaltyPointsAccrued / LoyaltyPointsRedeemed / LoyaltyPointsReversed

- **Description:** Loyalty point balance is a derived event stream, never a mutable field (BR-CUS-003).
- **Producer:** `CreateSaleCommand` (accrual), `RedeemLoyaltyCommand`, `ProcessReturnCommand` (reversal, per BR-SAL-007).
- **Consumers:** Loyalty balance projector, Customer & Loyalty report (Reports.md §2.8).
- **Payload:** `{ loyaltyEventId, customerId, pointsDelta, referenceOrderId, occurredAt }`.
- **Trigger:** Sale, redemption, or return against a sale with prior accrual.
- **Offline behavior:** Fully offline-capable; concurrent redemptions on two devices never race into an inconsistent balance because the balance is a sum of events, not a field (Sync_Architecture.md §3.3).
- **Sync behavior:** Class A within an otherwise Class B customer entity.
- **Failure handling:** A redemption that would take the balance negative is rejected as `BUSINESS_RULE_VIOLATION`.
- **Idempotency:** `change_id` per event.
- **Priority:** N/A.

### CreditLedgerEntryRecorded

- **Description:** A charge or payment against a customer's credit balance.
- **Producer:** `RecordCreditChargeCommand` / `RecordCreditPaymentCommand`.
- **Consumers:** Customer Debts report, reminder scheduler (BR-CUS-004).
- **Payload:** `{ entryId, customerId, amount, type: "charge"|"payment", dueDate, orderId (nullable), occurredAt }`.
- **Trigger:** Credit sale or payment recording.
- **Offline behavior:** Fully offline-capable.
- **Sync behavior:** Class A (ledger entries are append-only by nature).
- **Failure handling:** N/A.
- **Idempotency:** `change_id`.
- **Priority:** N/A directly (feeds scheduled reminder triggers, which are separately dispatched).

## 7. Promotions Context

### DiscountRuleCreated / CouponCreated / CampaignLaunched

- **Description:** Rule-engine configuration lifecycle events.
- **Producer:** `CreateDiscountCommand` / `CreateCouponCommand` / `LaunchCampaignCommand`.
- **Consumers:** POS discount-evaluation engine, Reports (Discount Analysis, Reports.md §2).
- **Payload:** `{ ruleId, ruleJson, scope, validFrom, validTo, occurredAt }`.
- **Trigger:** Marketing/Owner configuration actions.
- **Offline behavior:** Fully offline-capable; rules replicate to all devices via sync so a promotion configured on one device applies everywhere once synced.
- **Sync behavior:** Class B.
- **Failure handling:** Standard validation.
- **Idempotency:** `change_id`.
- **Priority:** N/A.

## 8. Tax & Compliance Context

### TaxRuleChanged

- **Description:** A tax rule's rate or scope changed.
- **Producer:** `UpdateTaxRuleCommand`.
- **Consumers:** POS tax-calculation engine, Audit Log writer.
- **Payload:** `{ taxRuleId, before_json, after_json, occurredAt }`.
- **Trigger:** Owner/Financial Manager configuration.
- **Offline behavior:** Fully offline-capable.
- **Sync behavior:** Class B; a rate change never retroactively alters a historical order's recorded tax (BR-TAX-005).
- **Failure handling:** N/A.
- **Idempotency:** `change_id`.
- **Priority:** N/A.

### ETAInvoiceSubmitted / ETAInvoiceSubmissionFailed

- **Description:** E-invoice submission lifecycle (only relevant when `companies.eta_enabled = true`).
- **Producer:** ETA submission worker.
- **Consumers:** Notification Dispatcher, Tax/ETA report (Reports.md §2.9).
- **Payload:** `{ etaInvoiceId, orderId, submissionStatus, payloadJson, submittedAt }`.
- **Trigger:** Scheduled/on-demand submission attempt.
- **Offline behavior:** Requires connectivity for actual submission; queued like any outbound sync traffic if offline (Reports.md §5).
- **Sync behavior:** Class B status field.
- **Failure handling:** `ETAInvoiceSubmissionFailed` fires a High-priority notification (Notifications.md §3).
- **Idempotency:** Deduplicated by `eta_uuid`.
- **Priority:** High.

## 9. Sync Context (Meta-Events)

### SyncBatchPushed / SyncBatchPulled

- **Description:** A batch of local outbox events was transmitted, or a batch of remote events was received.
- **Producer:** Sync Engine transport layer.
- **Consumers:** Sync health telemetry (Sync_Architecture.md §10), Sync Status UI indicator.
- **Payload:** `{ deviceId, peerOrServer, eventCount, transportUsed: "lan"|"cloud", occurredAt }`.
- **Trigger:** Connectivity available, outbox non-empty, or remote events pending.
- **Offline behavior:** N/A by definition (this event only fires when connectivity exists).
- **Sync behavior:** Meta-event, not itself synced further.
- **Failure handling:** Retried with exponential backoff (Sync_Architecture.md §8); never dropped.
- **Idempotency:** N/A (a telemetry event, not a state mutation).
- **Priority:** N/A.

### SyncConflictDetected / SyncConflictResolved

- **Description:** Lifecycle events for the Sync Conflict state machine (State_Machines.md §11).
- **Producer:** Conflict-resolver component (Sync_Architecture.md §5).
- **Consumers:** Notification Dispatcher, Conflict Review UI queue.
- **Payload:** `{ conflictId, entityType, entityId, localVersionJson, remoteVersionJson, conflictingFieldsJson, resolutionStatus, occurredAt }`.
- **Trigger:** Irreconcilable concurrent same-field edit detected during merge.
- **Offline behavior:** Detection happens locally whenever sync runs, online or LAN-offline-to-internet-but-LAN-connected.
- **Sync behavior:** The conflict record itself syncs so any device/owner can review it.
- **Failure handling:** Never auto-resolved for role/permission fields (BR-PER-006).
- **Idempotency:** `change_id` per conflict record.
- **Priority:** High (Notifications.md §3 "Sync conflict requires manual resolution").

## 10. Billing & Licensing Context

### SubscriptionTrialStarted / SubscriptionActivated / SubscriptionTrialExpired / SubscriptionPastDue / SubscriptionLocked

- **Description:** Lifecycle events for the Subscription state machine (State_Machines.md §6).
- **Producer:** Company onboarding (trial start), `POST /v1/subscription/upgrade` (activation), nightly trial-expiry job, payment-failure webhook, grace-period-exhaustion job.
- **Consumers:** Notification Dispatcher, Application-layer write-lock guard (Architecture.md §7 exception), client-side self-lock cache.
- **Payload:** `{ subscriptionId, companyId, status, trialEndsAt, occurredAt }`.
- **Trigger:** Company creation, upgrade action, or scheduled job evaluating `(status, trial_ends_at)`.
- **Offline behavior:** `SubscriptionTrialExpired`'s _effect_ (the self-lock) is evaluated locally from a cached `trialEndsAt` even fully offline (BR-LIC-008); the event's _generation_ happens server-side.
- **Sync behavior:** Propagated via the sync stream (`subscription.status_changed`, API.md §5.4) so an online device reflects a lock/unlock without waiting for its next poll cycle.
- **Failure handling:** N/A (these are status-transition facts, not failable operations themselves).
- **Idempotency:** Idempotent per `subscriptionId` + `status` transition.
- **Priority:** High → Critical as trial expiry nears; Critical at actual expiry (Notifications.md §3).

### PlatformAdminPlanChanged / PlatformAdminOverrideGranted / PlatformAdminAccountSuspended / PlatformAdminAccountReactivated / PlatformAdminTrialExtended

- **Description:** Every mutating Platform Admin action against a tenant account.
- **Producer:** `PATCH /v1/platform-admin/accounts/{id}/plan`, override grant command, `.../suspend`, `.../reactivate`, `.../trial/extend`.
- **Consumers:** `platform_admin_actions` writer (immutable, cross-tenant), Notification Dispatcher (tenant-facing generic status notification only — never exposing which admin or why, per API.md §8.4), peer Platform Admin notification (Notifications.md §10).
- **Payload:** `{ actionId, platformAdminId, targetCompanyId, actionCode, reason, before_json, after_json, occurredAt }` (Database.md §2.16.3).
- **Trigger:** Explicit Platform Admin action, always with a mandatory reason.
- **Offline behavior:** Not applicable — Platform Admin actions require a live, freshly-validated session by design (Security.md §11.3); there is no offline mode for this surface.
- **Sync behavior:** Never appears in any tenant-facing sync stream or `audit_entries` — it is exclusively stored and queried within the Platform Administration bounded context (Architecture.md §3.1).
- **Failure handling:** Rejected without a non-empty `reason` (BR-XCT-003).
- **Idempotency:** Each action call creates exactly one `platform_admin_actions` row; not idempotent by design (each action is a deliberate, individually-audited event, not a replayable sync event).
- **Priority:** Tenant sees only the resulting generic status change (Critical for suspend, High for reactivate/plan-change, per Notifications.md §3); the peer-admin visibility notification is always Critical, never batched (Notifications.md §10).

## 11. AI & Insights Context

### AIPredictionGenerated / AIAnomalyDetected / AIHealthScoreSnapshotCreated / AIRecommendationGenerated

- **Description:** Output events from scheduled AI batch jobs (AI.md §§3–4, 6–7).
- **Producer:** Nightly forecast worker, fraud/anomaly scoring worker, health-score aggregation worker, recommendation engine worker (`apps/backend/src/workers/ai-batch`).
- **Consumers:** AI Insights dashboard, Notification Dispatcher, Reports (Store Health Dashboard, Reports.md §2.11).
- **Payload:** `{ insightId, companyId, branchId, type, deterministicValue, narrativeText, source, generatedAt }`.
- **Trigger:** Scheduled nightly job completion.
- **Offline behavior:** Generation requires backend connectivity; results sync down to devices like any other read-model data and remain viewable offline once synced (AI.md hybrid model).
- **Sync behavior:** Class B (regenerated periodically, not incrementally merged).
- **Failure handling:** A failed provider call falls back per the provider chain (BR-AI-007); the deterministic numeric core never depends on the LLM call succeeding (BR-AI-002).
- **Idempotency:** Regenerated (overwritten) on each scheduled run, not appended indefinitely — old snapshots retained for historical trend viewing per `ai_health_score_snapshots`.
- **Priority:** Low for prediction-ready/dead-product (batched daily digest), High for Store Health sub-score drop, Critical for fraud/anomaly (Notifications.md §3).

### AIInsightFeedbackSubmitted

- **Description:** Owner accepted or rejected an AI recommendation (State_Machines.md §16).
- **Producer:** `POST /v1/ai/insights/{id}/feedback`.
- **Consumers:** AI evaluation/acceptance-rate tracker (AI.md §10), the real downstream domain command if accepted (e.g., `UpdatePriceCommand`).
- **Payload:** `{ insightId, accepted: boolean, actingUserId, occurredAt }`.
- **Trigger:** Owner/permitted role interacts with a presented recommendation.
- **Offline behavior:** Fully offline-capable; feedback queues and syncs normally.
- **Sync behavior:** Class B.
- **Failure handling:** N/A.
- **Idempotency:** One feedback record per insight per interaction; a changed mind creates a new feedback record rather than editing the prior one, preserving full history.
- **Priority:** N/A.

## 12. Reports & Notifications Context (Internal)

### ReadModelProjected

- **Description:** Internal event marking that a report read-model table/view was updated in response to an upstream Domain Event.
- **Producer:** Report Materialization Worker (`apps/backend/src/workers/report-materialization`).
- **Consumers:** Report Viewer queries (indirectly, by reading the resulting table).
- **Payload:** `{ readModelName, companyId, branchId, sourceEventId, projectedAt }`.
- **Trigger:** Any upstream Domain Event the projector subscribes to.
- **Offline behavior:** The identical projection logic runs locally on Desktop/Android for offline parity (Reports.md §1).
- **Sync behavior:** Not itself synced; it is a local/backend side effect of already-synced source events.
- **Failure handling:** A projection failure does not affect the source event's durability — the event remains in the log and can be re-projected.
- **Idempotency:** Re-running a projection against the same event is idempotent by design (projections are pure functions of the event log).
- **Priority:** N/A.

### NotificationDispatched

- **Description:** The Dispatcher decided a trigger (per Notifications.md §3) warrants creating a `notifications` row and attempting delivery.
- **Producer:** Notification Dispatcher, subscribing to the specific Domain Event that matches a Trigger Catalog row.
- **Consumers:** Channel Adapters (in-app, push, email, SMS/WhatsApp future).
- **Payload:** `{ notificationId, companyId, recipientUserId, triggerCode, priority, title, body, referenceType, referenceId, createdAt }` (Database.md §7.1).
- **Trigger:** Any event matching a Notifications.md §3 catalog row.
- **Offline behavior:** Locally-computable triggers (e.g., stock-below-reorder from local data) fire immediately offline; cross-device-aware triggers fire once the underlying event syncs to the recipient's device (BR-NOT-006).
- **Sync behavior:** The `notifications` row itself is company/user-scoped Class B data, synced normally.
- **Failure handling:** A channel delivery failure never removes the in-app record (State_Machines.md §13).
- **Idempotency:** One `notifications` row per triggering event per recipient; the Dispatcher deduplicates so the same domain event never produces two notifications for the same recipient/category.
- **Priority:** Inherited from the triggering event's catalog entry (Notifications.md §3).

---

_Event_Catalog.md — every event listed here must have a producer traceable to a named Command in Coding_Standards.md §4's naming convention and at least one consumer; an event with zero consumers should be flagged for removal rather than left speculative._
