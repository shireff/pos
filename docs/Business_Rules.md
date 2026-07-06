# Business_Rules.md — Smart Retail OS Business Rules Catalog

**Depends on:** PRD.md, Architecture.md, Database.md, Sync_Architecture.md, AI.md, Security.md, Hardware.md, Reports.md, Notifications.md
**Feeds into:** Functional_Specification.md (workflow detail), Testing.md (every rule requires a corresponding unit test per Testing.md §2), State_Machines.md (state-transition rules referenced, not re-derived, here)
**Governing rule:** Every rule below is deterministic and enforced at the Application/Domain layer (never only in the UI, per UI_UX.md §4 and Security.md §4). A rule stated here with no corresponding test is treated as unimplemented (Testing.md §2). Numbering is stable — a rule's ID (e.g., `BR-INV-004`) is referenced by tests and PRs and must never be renumbered, only appended to or (rarely) deprecated with a note.

## 1. Inventory Rules

- **BR-INV-001:** Stock quantity is never a directly-writable field; it is always the sum of applicable `stock_movement_events` for a given `(product_variant_id, warehouse_id, batch_id)` (Architecture.md §6, Database.md §2.7–2.8).
- **BR-INV-002:** Every stock-affecting action (sale, return, transfer, adjustment, purchase receipt, bundle deduction, expiry write-off, damage write-off) appends an immutable event; events are never edited or deleted — a correction is a new, opposite-signed event referencing the event it corrects (Sync_Architecture.md §3.1).
- **BR-INV-003:** Selling a bundle deducts stock from every component product per its configured bundle ratio in the same atomic local transaction as the sale event (PRD FR-3.6).
- **BR-INV-004:** A bundle sale is blocked at the point of sale if any single component's available stock is insufficient — the system never oversells silently and identifies exactly which component is short (PRD §7 edge case).
- **BR-INV-005:** Stock may go transiently negative when an offline sale event has not yet been reconciled against a not-yet-synced restock event; this is allowed but flagged, and self-corrects once all events merge. A lasting negative balance after full sync converges into an AI anomaly alert (Sync_Architecture.md §3.1, AI.md §4).
- **BR-INV-006:** Unit-of-measure conversions (e.g., carton → piece) automatically recalculate price and stock across all defined units for a product; a conversion factor change never silently rewrites historical `stock_movement_events` (PRD FR-3.3).
- **BR-INV-007:** Batch/lot tracking requires manufacturing and expiry dates for any product flagged `requires_batch_tracking`; expiry-based FEFO (first-expire-first-out) is a suggestion at sale/pick time, not an enforced hard rule, unless the company enables strict FEFO enforcement (PRD FR-3.2).
- **BR-INV-008:** Sale of an expired batch is blocked by default; an owner-configurable override requires manager approval and is itself an audited action (PRD §7 edge case, Database.md §7 trigger).
- **BR-INV-009:** A manual stock adjustment requires a mandatory reason; adjustments above a company-configured threshold require approval before the corresponding event is committed as final (PRD FR-2.6). A pending-approval adjustment does not yet affect the stock projection until approved.
- **BR-INV-010:** Reorder points are either manually set per product/branch or AI-suggested (based on sales velocity/seasonality); an AI-suggested reorder point never becomes an active threshold without explicit owner acceptance (PRD FR-3.7, AI.md §3).
- **BR-INV-011:** A stock transfer follows the fixed lifecycle Request → Approval → Shipment → Receiving → Inventory Adjustment, with an audit log entry at every step; stock leaves the source warehouse's projection only at Shipment and enters the destination's projection only at Receiving (PRD FR-10.1).
- **BR-INV-012:** A stock transfer's Receiving step may record a quantity different from what was Shipped (damage/loss in transit); the discrepancy is captured explicitly, never silently absorbed into the destination's opening balance.
- **BR-INV-013:** Serial-number tracking, where enabled per category, requires a unique serial per physical unit at receipt and at sale; a serial cannot be sold twice while active in stock (PRD FR-3.5).
- **BR-INV-014:** Two stock events for the same product from different devices are never a sync conflict — both are applied and the projection recalculates, because addition is commutative (Sync_Architecture.md §3.1, §5).

## 2. Sales & Invoicing Rules

- **BR-SAL-001:** A sale (`Order`) is itself an event; a return is a new, linked event — the original sale is never edited (Sync_Architecture.md §3.3).
- **BR-SAL-002:** `orders.grand_total` is always ≥ 0 and every `order_lines.quantity` is always > 0, enforced by a database CHECK constraint in addition to Application-layer validation (Database.md §7).
- **BR-SAL-003:** A sale supports unlimited combinations of split tenders in a single transaction; the sum of all tender amounts must equal `grand_total` before the order is allowed to complete (PRD FR-7.2).
- **BR-SAL-004:** Every sale created offline carries a client-generated `clientTxnId`; replaying the same `clientTxnId` during sync is idempotent and never creates a duplicate order (API.md §4.2).
- **BR-SAL-005:** A return may be full, partial, or an exchange; refund method may be the original tender or store credit; a mandatory reason is always captured (PRD FR-4.3).
- **BR-SAL-006:** A return/refund above a company-configured threshold requires explicit approval (`sales.refund.approve`) before the refund is finalized; below the threshold, a permitted role may complete it directly (PRD FR-4.3, Permission_Matrix.md §5).
- **BR-SAL-007:** When a refund is processed against a sale on which loyalty points were earned, those points are automatically reversed proportionally to the refunded amount (PRD §7 edge case).
- **BR-SAL-008:** Receipt printing failure (offline, paper out, driver error) never blocks sale completion; the sale is already recorded and a digital-receipt fallback (screen + optional message share) is shown instead (Hardware.md §2, §8).
- **BR-SAL-009:** A cashier shift closes independently of pending sync — end-of-shift reconciliation reads local state only; unsynced transactions remain queued and sync automatically afterward without blocking shift close (PRD §7 edge case, Sync_Architecture.md §8).
- **BR-SAL-010:** A device restarting mid-transaction (crash/power loss) after the local commit but before the Outbox send must never lose the completed sale — the event remains present locally and syncs on next launch (Testing.md §5).
- **BR-SAL-011:** A cash-tender sale automatically triggers cash drawer open; drawer failure (jammed, disconnected) never blocks sale completion — a manual-open prompt is shown instead (Hardware.md §4).
- **BR-SAL-012:** A manager "no-sale open" drawer action is always permission-gated and always logged, since it is also a fraud-detection signal (Hardware.md §4, AI.md §4).

## 3. Returns Rules

- **BR-RET-001:** A return must reference an original sale (`original_order_id`); a return with no traceable originating sale is not permitted through the standard return flow.
- **BR-RET-002:** Return approval workflow branches on the configured refund threshold (Database.md §2.10 `returns.status`: `pending_approval` / `approved` / `rejected`) — see State_Machines.md §3 for the full transition table.
- **BR-RET-003:** A rejected return does not reverse any stock or loyalty effect; only an approved return triggers the corresponding `RETURN` stock event and loyalty point reversal (BR-SAL-007).
- **BR-RET-004:** Returned stock re-enters the warehouse projection via a `RETURN` event type, distinct from `ADJUSTMENT`, so return-driven stock changes are separately reportable (Reports.md §2.4, §3 Return Rate KPI).

## 4. Taxes Rules

- **BR-TAX-001:** Tax calculation is rule-engine-driven (`tax_rules.rate`, `applies_to`) — never hardcoded per-product tax logic; adding a new tax rule requires no code change (PRD FR-9.1, Coding_Standards.md §3 Open/Closed).
- **BR-TAX-002:** Egypt VAT-style configuration is the default at company creation; other tax regimes are architecturally supported but not activated for non-Egypt markets in v1 (PRD FR-9.1, §8 Out of Scope).
- **BR-TAX-003:** The ETA e-invoicing module is disabled by default per company (`companies.eta_enabled = false`) and is only toggled on explicitly when required (PRD A7, FR-9.2).
- **BR-TAX-004:** Once `eta_enabled = true`, every qualifying order generates an `eta_invoices` record with `submission_status` tracked (`pending`/`submitted`/`failed`); a failed submission fires a High-priority notification to Owner/Accountant (Notifications.md §3).
- **BR-TAX-005:** Tax amount is computed and stored per `order_lines.tax_amount` at the time of sale — a later tax rate change never retroactively alters a historical order's recorded tax.

## 5. Pricing & Discounts Rules

- **BR-PRC-001:** A product has exactly one current price per unit at any given moment; historical cost is snapshotted per sale line (`unit_price`, and COGS from `product_variants.cost` at time of sale) so Profit & Loss reporting reflects true historical cost, not current cost (Reports.md §2.2).
- **BR-PRC-002:** Discount types (item, cart, category, customer-specific, membership, time-based, Buy-X-Get-Y, quantity break) and coupons (percentage/fixed, single/multi-use, expiry, scoped) are all rule-engine-driven (`rule_json`) — never hardcoded per discount type (PRD FR-8.1–8.3).
- **BR-PRC-003:** A discount amount can never exceed the line subtotal it applies against; this is enforced at both UI (convenience) and domain-command layer (authority) (UI_UX.md §4).
- **BR-PRC-004:** A discount applied above a cashier's/sales employee's configured threshold requires approval before the sale can complete (Permission_Matrix.md §5, PRD FR-2.6).
- **BR-PRC-005:** An AI-generated dynamic pricing recommendation never applies to a live price record without explicit owner approval through the exact same `UpdatePriceCommand` a manual edit would use — there is no AI-auto-approve code path (AI.md §6, Testing.md §9).
- **BR-PRC-006:** A price change on a product is a Class B (field-merge) sync entity, but the `price` field is flagged for stricter conflict review — a concurrent price edit on two offline devices is never silently resolved by last-write-wins (Sync_Architecture.md §3.2, §3.3).

## 6. Customers Rules

- **BR-CUS-001:** A customer is identified via phone number, loyalty ID, or customer code (PRD FR-6.1); guest/anonymous sales are never attributed to a customer record retroactively.
- **BR-CUS-002:** AI customer features (segmentation, RFM analysis, churn) apply only to identified customers; guest/anonymous sales are excluded from all customer-level AI analysis (AI.md §8, Reports.md §2.8).
- **BR-CUS-003:** Loyalty point balance is a derived event stream (accrual/redemption events), not a mutable field, so concurrent redemptions across devices never race into an inconsistent balance (Sync_Architecture.md §3.3).
- **BR-CUS-004:** A customer credit ledger entry (`charge`/`payment`) always references a due date where applicable; automated reminders for outstanding balances fire via the customer's configured channel (PRD FR-6.3).
- **BR-CUS-005:** Loyalty program structural rules (points-per-currency ratio, tier thresholds) are Owner/Company-Administrator-configurable only; campaign-level bonus-point rules may additionally be configured by Marketing Employee (Permission_Matrix.md §7).

## 7. Suppliers & Purchasing Rules

- **BR-SUP-001:** A purchase order follows draft → pending_approval → approved → received → cancelled; an approval-workflow threshold determines whether a PO requires explicit approval before proceeding to ordering (Database.md §2.12, State_Machines.md §4).
- **BR-SUP-002:** Goods receiving against a PO records any discrepancy (quantity received vs. ordered) explicitly rather than silently reconciling it — a discrepancy is a fact to review, not an error to hide (PRD FR-5.1).
- **BR-SUP-003:** Supplier invoice OCR-extracted fields are always shown as an editable pre-filled form and never auto-committed to purchase/supplier-invoice records without explicit user confirmation (AI.md §5).
- **BR-SUP-004:** Every manual correction a user makes to OCR output is logged and used to refine future extraction quality — corrections are a continuous-improvement input, not discarded (AI.md §5).
- **BR-SUP-005:** Supplier performance rating (on-time delivery %, price variance) is computed deterministically from purchase/receiving history, with the LLM layer used only for narrative explanation, never for the underlying score (AI.md §3, Reports.md §2.10).

## 8. Branches & Warehouses Rules

- **BR-BRN-001:** Company-level settings (currency, tax mode, language, working hours) cascade as defaults to branches; a branch may override only where the specific business rule explicitly allows it (PRD FR-1.3).
- **BR-BRN-002:** A branch may have its own warehouse or share a central/shared warehouse; a product's stock visibility is aggregated at company level for the Owner across every warehouse (PRD FR-1.2, FR-3.8).
- **BR-BRN-003:** Cross-branch transfers require the acting user to hold transfer-creation permission at the source branch and receiving/approval permission at the destination branch independently — standing at one branch never implies standing at another (Permission_Matrix.md §20).

## 9. Users, Roles & Permissions Rules

- **BR-PER-001:** Permission enforcement happens exclusively at the Application layer (command/query handlers); UI-level permission filtering is a convenience only and is never the sole gate (Security.md §4, UI_UX.md §4).
- **BR-PER-002:** A user may hold a different role at each branch they operate in simultaneously, via `user_branch_roles` (Database.md §2.5, PRD FR-2.3).
- **BR-PER-003:** System roles (`is_system_role = true`) are non-deletable defaults; a custom role can never grant a permission the system doesn't already define, and can never include a Platform Administration capability under any circumstance (Security.md §4, Architecture.md §3.1).
- **BR-PER-004:** A 403 permission-denial response always names the specific missing `permissionCode` — never a generic denial (API.md §2.2, Security.md §4).
- **BR-PER-005:** Shift-based access restricts a user's login to a defined working-hours window when configured; a login outside that window is either blocked or flagged as a late login, per company configuration (PRD FR-2.5).
- **BR-PER-006:** A sync conflict on a role/permission field always escalates to Owner-level resolution, never Branch Manager, regardless of the normal resolution ceiling for other Class B conflicts at that branch (Sync_Architecture.md §5).

## 10. Synchronization Rules

- **BR-SYN-001:** A local write is considered complete the instant it durably commits to the local database; sync is a background process and never a precondition for completing a business operation (Sync_Architecture.md §2, NFR-2).
- **BR-SYN-002:** Inventory and all event-sourced (Class A) entities are synced by pure event replay — order of arrival never affects the final projected total (Sync_Architecture.md §3.1).
- **BR-SYN-003:** Non-inventory (Class B) entities merge per-field by Hybrid Logical Clock: a later-HLC change to a given field wins automatically only when the deciding device had causally seen the earlier change; otherwise the field is a manual conflict (Sync_Architecture.md §3.2).
- **BR-SYN-004:** Changes to two different fields of the same Class B record, made concurrently on two devices, both auto-apply — this is the common case, never treated as a conflict (Sync_Architecture.md §5).
- **BR-SYN-005:** No mutation is ever silently discarded; an unresolvable concurrent same-field conflict always surfaces a manual Conflict Review item, never a silent last-write-wins pick (Sync_Architecture.md §2, §5).
- **BR-SYN-006:** Every synced change carries its own idempotent `change_id` (event_id/UUIDv7); re-applying the same `change_id` twice is a guaranteed no-op (Sync_Architecture.md §6).
- **BR-SYN-007:** Transport selection (LAN peer-to-peer vs. cloud relay) is fully automatic; the owner never manually chooses a transport (Sync_Architecture.md §7).
- **BR-SYN-008:** A change never expires out of the local outbox; it remains queued indefinitely until acknowledged by at least one peer or the cloud relay (Sync_Architecture.md §8, NFR-2).
- **BR-SYN-009:** A record archived (soft-deleted) on one device and edited on another both apply — the record ends up archived with the edited field values, and the Owner is notified to review (Sync_Architecture.md §5).
- **BR-SYN-010:** A bundle sale's component-stock-sufficiency check happens locally, before sync, at the point of sale — sync is never permitted to retroactively "undo" a completed sale due to a merge outcome (Sync_Architecture.md §5, BR-INV-004).
- **BR-SYN-011:** A device syncs only with peers holding a valid, registered credential for the same company; cross-tenant sync is structurally impossible even on a shared physical network (Sync_Architecture.md §9, PRD A1).

## 11. AI Rules

- **BR-AI-001:** AI never executes an irreversible action (price change, deletion, purchase order creation) without explicit owner approval — this is the single governing rule of the entire AI system (AI.md governing rule, Vision.md §5).
- **BR-AI-002:** Every numeric forecast (sales/inventory prediction) is computed by a deterministic statistical baseline; the LLM layer generates only natural-language explanation of that number, never the number itself (AI.md §3).
- **BR-AI-003:** Fraud/anomaly scoring is deterministic and rule-based; the LLM layer only synthesizes a human-readable explanation of an already-computed score, never decides the score (AI.md §4).
- **BR-AI-004:** No raw database dump is ever sent to a third-party cloud AI provider; only pre-aggregated, minimal read-model slices relevant to the specific query are included in any cloud prompt (AI.md §2, Security.md §7).
- **BR-AI-005:** Customer PII is included in an AI prompt only when the specific query genuinely requires identifying that customer, and is never included in a prompt used for cross-query caching (AI.md §9, Security.md §7).
- **BR-AI-006:** A malformed/off-schema AI response triggers exactly one automatic retry, then a graceful fallback message — a garbled response is never shown directly to the user (AI.md §2, Testing.md §9).
- **BR-AI-007:** If the primary cloud AI provider fails or times out, the system falls back Groq → Gemini Flash → graceful degradation, and every response tags its `source` (`local`/`groq`/`gemini`) (AI.md §1).
- **BR-AI-008:** Store Health Score and its five sub-scores are each computed deterministically from domain read models; only the narrative summary and top-3 recommended actions are LLM-generated (AI.md §7).
- **BR-AI-009:** Every AI-generated recommendation writes an `ai_insight_feedback` record when the owner accepts or rejects it; a declining acceptance rate for a feature is tracked as an early-warning signal (AI.md §10).
- **BR-AI-010:** Local-model routing is preferred by default whenever query classification allows it — the strongest available privacy guarantee (query never leaves the device) is chosen whenever feasible (AI.md §1, §9).
- **BR-AI-011:** All AI features remain fully available, unthrottled, and untiered throughout the 14-day trial — there is no AI feature gating specific to the trial window (PRD FR-16.4, Security.md §6.2).

## 12. Licensing & Subscription Rules

- **BR-LIC-001:** Every new company begins a single 14-calendar-day free trial with every plan tier's features unlocked (Enterprise-equivalent); there is no permanent free tier and no feature-limited "lite trial" (PRD A6, FR-16.4).
- **BR-LIC-002:** When `trialEndsAt` passes with no active paid plan selected, the account transitions to `trial_expired` and becomes fully write-locked — no module remains writable, and no new offline transaction may be recorded, until a paid tier is activated (PRD FR-16.5).
- **BR-LIC-003:** A locked account (`trial_expired` or `suspended`) always retains read-only access to its own historical data, the ability to export a backup, and access to the billing/upgrade or support-contact screen; it may never create, edit, or delete a business record, and may never use an AI feature, while locked (PRD FR-16.5, Security.md §6.2).
- **BR-LIC-004:** Offline-queued transactions recorded before a lock are never discarded; they remain safely queued and apply automatically the moment the account is reactivated (PRD FR-16.5, NFR-2).
- **BR-LIC-005:** Trial-ending reminders fire at day 7, day 3, day 1, and at the moment of lock — an Owner is never surprised by a lock (PRD FR-16.6, Notifications.md §3).
- **BR-LIC-006:** Ordinary license/subscription staleness (a device unable to re-validate recently) is never a hard block within the configured grace period — a paying company in good standing never loses the ability to sell due to a connectivity gap alone (Security.md §6.2, API.md §2.3).
- **BR-LIC-007:** Trial expiration is a stricter, distinct case from ordinary license staleness — it is the one deliberate, intentional override of the offline-first "never block a sale" guarantee, because a trial-expired account is not a paying customer with a continuity guarantee to protect (Security.md §6.2, Architecture.md §7).
- **BR-LIC-008:** A device caches `trialEndsAt` from its last sync and self-locks locally at that timestamp even fully offline — a trial cannot be extended by staying disconnected (Security.md §6.2, Notifications.md §1).
- **BR-LIC-009:** Reactivating a locked account (selecting/paying for a tier) unlocks all functionality immediately upon payment confirmation, with no re-onboarding required, and all pre-lock data (including safely-queued offline transactions) is exactly as it was (PRD FR-16.7).
- **BR-LIC-010:** A Platform Admin full-access override (`is_full_access_override = true`) always supersedes normal trial/lock logic, behaving as fully Enterprise-entitled regardless of `status`/`plan_id`/`trial_ends_at`, until revoked or its `override_expires_at` passes (Database.md §2.16.1, PRD FR-19.4).
- **BR-LIC-011:** Entitlement resolution is evaluated in a fixed, first-match-wins order: (1) active full-access override, (2) active trial, (3) active paid plan's `feature_flags_json`, (4) active-but-past-due within grace period, (5) fully locked (Database.md §2.16.1).
- **BR-LIC-012:** Only the Owner role may invoke `POST /v1/subscription/upgrade`; this permission is never assignable to any other role, including a custom role (PRD FR-16.7, Permission_Matrix.md §18).

## 13. Backup & Disaster Recovery Rules

- **BR-BAK-001:** Backups are incremental, encrypted, and compressed, and may target any combination of local disk, external drive, network storage, and cloud (PRD FR-15.1).
- **BR-BAK-002:** A backup's encryption key is derived independently from the live database's encryption key — a compromised backup alone never exposes the live key, and vice versa (Security.md §8).
- **BR-BAK-003:** Every backup includes an integrity checksum verified on restore; a failed integrity check blocks the restore and surfaces a plain-language error rather than silently restoring a corrupted state (Security.md §8).
- **BR-BAK-004:** Restore is a permission-gated, confirmation-required destructive action, but remains available even during a `trial_expired`/`suspended` lock, since it is a data-safety operation explicitly excluded from the write-lock (Security.md §8, §6.2).
- **BR-BAK-005:** Automatic daily backup and on-demand manual backup both run automatic integrity verification; point-in-time and selective restore are both supported (PRD FR-15.2).

## 14. Notifications Rules

- **BR-NOT-001:** No feature emits a notification directly; every trigger source (Domain Event, AI job output, scheduled job, Platform Admin action) is only ever observed and decided upon by the single centralized Notification Dispatcher (Notifications.md §1).
- **BR-NOT-002:** Priority (Critical/High/Normal/Low) is a fixed property of the trigger type, never user-configurable per instance; only the delivery channel is user-configurable, and only within the bounds defined per priority (Notifications.md §4–5).
- **BR-NOT-003:** Critical and High priority notifications for safety-relevant categories (stockout, fraud, sync conflict, license/trial expiry, account suspension) can never be suppressed by user preference — only their channel (e.g., push on/off) is configurable, never their existence as an in-app record (Notifications.md §4).
- **BR-NOT-004:** The Billing & Trial category can never be muted at all, not even the channel, once a trial has entered its final 4 days, and is exempt from any daily-cap batching (Notifications.md §4, §9).
- **BR-NOT-005:** The Approval-pending pattern is atomic: the requester's "Submitted — pending approval" state and the approver's notification always fire together from the same domain event, never one without the other (Notifications.md §6, UI_UX.md §3).
- **BR-NOT-006:** Locally-generated notifications (computed entirely from local data) fire immediately, with no dependency on connectivity; cross-device-aware notifications deliver once the underlying Domain Event syncs to the recipient's device, which independently evaluates the trigger — there is no central notification-sync mechanism (Notifications.md §8).
- **BR-NOT-007:** The trial-countdown/expired trigger is evaluated independently on every device against its own cached `trialEndsAt`, so the countdown/lockout fires identically everywhere without requiring a single source-of-truth device (Notifications.md §1, §8).
- **BR-NOT-008:** A per-category daily cap on Normal/Low priority notifications folds excess entries into a single summary rather than dropping them silently, except for the Billing & Trial category, which is exempt from any cap (Notifications.md §9).

## 15. Hardware Rules

- **BR-HW-001:** No POS-critical flow (completing a sale, opening the drawer) ever hard-depends on a peripheral being present or functional; every hardware interaction has a software fallback (Hardware.md governing rule, Vision.md §5).
- **BR-HW-002:** All peripheral interaction goes through an interface defined in domain/application and implemented in infrastructure; no feature code ever calls a device driver/SDK directly (Hardware.md §1).
- **BR-HW-003:** Barcode/checksum validation and duplicate-barcode warnings happen at the UI/application layer, independent of which physical scan method (keyboard-wedge, camera) produced the input (Hardware.md §3, UI_UX.md §4).
- **BR-HW-004:** A scale reading is only accepted by the POS UI once `isStable = true`; manual weight entry is always available as a fallback regardless of scale connectivity (Hardware.md §5).
- **BR-HW-005:** No peripheral failure ever surfaces a raw technical error to the cashier; every failure maps to plain-language guidance (Hardware.md §8, UI_UX.md §5).
- **BR-HW-006:** Hardware adapter/pairing configuration is per-device (Desktop instance / Android instance), never per-company, since physical peripherals attach to a specific machine (Hardware.md §6).

## 16. Reporting Rules

- **BR-REP-001:** Every report reads exclusively from denormalized read models, never directly from transactional/event tables (Reports.md §1, Architecture.md §4 CQRS).
- **BR-REP-002:** Every report renders fully offline from the device's local event log/local read-model projection, with a visible "as of last sync" timestamp when the device hasn't recently synced (Reports.md §1, UI_UX.md §3).
- **BR-REP-003:** Every report query is always scoped by `company_id` and, where applicable, `branch_id`, enforced identically to every other tenant-isolated query (Reports.md §1, Database.md §4).
- **BR-REP-004:** Every KPI has exactly one canonical formula, defined once in the KPI Definitions Registry (Reports.md §3); no report or dashboard may compute the same-named KPI with a different formula.
- **BR-REP-005:** A KPI formula change is a documentation change to the KPI registry in the same PR that changes the underlying code — never a silent divergence (Reports.md §3).
- **BR-REP-006:** Scheduled report generation reuses the exact same read-model queries as the corresponding on-demand endpoint — there is no separate "batch-only" report logic (Reports.md §5).
- **BR-REP-007:** Reports remain readable during a `trial_expired`/`suspended` lockout — a locked-out owner always retains visibility into their own historical data (API.md §4.6, UI_UX.md §2.5).

## 17. Cross-Cutting Rules

- **BR-XCT-001:** No tenant-facing permission code, however powerful, can ever grant a Platform Administration capability, and no Platform Admin action can ever be reachable through a tenant JWT — the two systems are disjoint by construction (Architecture.md §3.1, Security.md §11).
- **BR-XCT-002:** Every Platform Admin action against a company is recorded in `platform_admin_actions` — a separate, immutable, cross-tenant audit trail never visible to any tenant, including the affected company's own Owner (Architecture.md §3.1, API.md §8.4).
- **BR-XCT-003:** Every Platform Admin mutating action (plan change, override grant, suspend, reactivate, trial extend) requires a mandatory, non-empty `reason` field, stored verbatim (PRD FR-19.4–19.6, API.md §8.3).
- **BR-XCT-004:** Every state-changing command writes an `audit_entries` record capturing before/after state, acting user, device, and timestamp — including actions performed fully offline, which sync to the server's audit trail like any other event (Security.md §5).
- **BR-XCT-005:** `audit_entries` and `stock_movement_events` are both append-only and immutable at the database trigger level — a direct UPDATE/DELETE attempt is rejected by the database itself, not merely discouraged by application discipline (Database.md §7, Testing.md §8).
- **BR-XCT-006:** Soft-delete (archival) is used for every business entity; hard delete is never permitted except via an explicit GDPR-style data erasure request (PRD A4).
- **BR-XCT-007:** All timestamps are stored in UTC and rendered in branch-local timezone, defaulting to Africa/Cairo (PRD A3).
- **BR-XCT-008:** Currency is always stored as integer minor units (piasters) to avoid floating-point financial errors, and always formatted through the shared `Money` value object — never raw `Number` (PRD A2, Coding_Standards.md §11).

---

_Business_Rules.md — every rule ID here traces to a source document section; new rules are appended with the next sequential ID in their category and are never renumbered once referenced by a test or PR._
