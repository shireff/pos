# Database.md — Smart Retail OS Database Design

**Local DB:** MongoDB (embedded, offline-first) on Desktop & Android — identical collection schemas.
**Server DB:** PostgreSQL — same logical data model, used for cloud relay/reporting/multi-tenant aggregation.
**Depends on:** Architecture.md (Bounded Contexts, Event Sourcing scope)

## 1. ERD — High-Level (entity groups; full column-level ERD lives in the generated schema migration files)

```
Company 1───* Branch 1───* Warehouse 1───* StockItem *───1 Product 1───* ProductVariant
Company 1───* User *───* Role *───* Permission
Branch 1───* Order 1───* OrderLine *───1 ProductVariant
Order 1───* Payment
Order 1───* Return
Company 1───* Customer 1───* LoyaltyAccount
Company 1───* Supplier 1───* PurchaseOrder 1───* PurchaseOrderLine
Warehouse 1───* StockMovementEvent *───1 ProductVariant   (event-sourced, append-only)
Branch 1───* StockTransfer 1───* StockTransferLine
Company 1───* Discount / Coupon / Campaign
Company 1───* TaxRule
Company 1───* Subscription 1───1 LicenseKey
Subscription *───1 SubscriptionPlan                       (data-driven plan/feature-flag reference)
PlatformAdmin *───* Company                                (cross-tenant management, no company_id ownership)
PlatformAdmin 1───* PlatformAdminAction                     (immutable, cross-tenant audit)
Device *───1 Company                                      (registered devices)
Device 1───* SyncEvent                                     (outbox/inbox log)
Company 1───* AuditEntry
Company 1───* AIInsight / Prediction / Anomaly / HealthScoreSnapshot
```

## 2. Core Tables (representative — columns not exhaustively listed for brevity; every table below carries the standard audit columns in §5)

### 2.1 `companies`

| Column            | Type    | Notes                                |
| ----------------- | ------- | ------------------------------------ |
| id                | UUID PK |                                      |
| name              | TEXT    |                                      |
| business_type     | TEXT    | grocery / pharmacy / clothing / etc. |
| default_currency  | TEXT    | ISO 4217, default 'EGP'              |
| default_language  | TEXT    | 'ar' / 'en'                          |
| timezone          | TEXT    | default 'Africa/Cairo'               |
| subscription_tier | TEXT    | free/basic/pro/enterprise            |
| eta_enabled       | BOOLEAN | ETA module toggle                    |

### 2.2 `branches`

id, company_id (FK), name, address, warehouse_id (FK, nullable if using central warehouse), working_hours_json, is_active

### 2.3 `warehouses`

id, company_id (FK), branch_id (FK, nullable = central warehouse), name, is_central (BOOLEAN)

### 2.4 `users`

id, company_id (FK), name, phone, email, password_hash, is_active, default_branch_id (FK)

### 2.5 `roles` / `permissions` / `role_permissions` / `user_branch_roles`

- `roles`: id, company_id (nullable for system-predefined roles), name, is_system_role
- `permissions`: id, module, action (view/create/edit/delete/approve), code (unique)
- `role_permissions`: role_id, permission_id (composite PK)
- `user_branch_roles`: user_id, branch_id, role_id (composite PK) — implements "different role per branch"

### 2.6 `products` / `product_variants` / `product_units` / `bundles` / `bundle_components`

- `products`: id, company_id, category_id, base_unit_id, is_bundle, is_serialized, requires_batch_tracking
- `product_variants`: id, product_id, sku, barcode, attributes_json (size/color/etc.), price, cost
- `product_units`: id, product_id, unit_name, conversion_factor_to_base
- `bundle_components`: bundle_variant_id, component_variant_id, quantity

### 2.7 `stock_items` (current projected balance — derived/cached, never the source of truth)

id, warehouse_id, product_variant_id, batch_id (nullable), quantity_on_hand (projection), reorder_point, updated_from_sequence (last event sequence applied)

### 2.8 `stock_movement_events` (event-sourced, append-only, immutable)

id, warehouse_id, product_variant_id, batch_id, event_type (SALE/RETURN/TRANSFER_OUT/TRANSFER_IN/ADJUSTMENT/PURCHASE_RECEIPT), quantity_delta, occurred_at, originating_device_id, sequence_no (per-device monotonic), causality_vector (JSON), reference_type, reference_id

### 2.9 `batches`

id, product_variant_id, batch_number, manufactured_at, expires_at, warehouse_id

### 2.10 `orders` / `order_lines` / `payments` / `returns`

- `orders`: id, branch_id, cashier_id, customer_id (nullable), status, subtotal, discount_total, tax_total, grand_total, created_at
- `order_lines`: id, order_id, product_variant_id, batch_id, quantity, unit_price, discount_amount, tax_amount
- `payments`: id, order_id, tender_type, amount, provider_reference
- `returns`: id, original_order_id, reason, refund_method, status (pending_approval/approved/rejected)

### 2.11 `customers` / `loyalty_accounts` / `credit_ledger_entries`

- `customers`: id, company_id, name, phone, loyalty_code
- `loyalty_accounts`: customer_id, points_balance, membership_tier
- `credit_ledger_entries`: id, customer_id, amount, type (charge/payment), due_date, order_id (nullable)

### 2.12 `suppliers` / `purchase_orders` / `purchase_order_lines` / `supplier_invoices`

Standard procurement structure; `purchase_orders.status` enum: draft/pending_approval/approved/received/cancelled.

### 2.13 `stock_transfers` / `stock_transfer_lines`

id, from_warehouse_id, to_warehouse_id, status (requested/approved/shipped/received/cancelled), lines with product_variant_id, quantity_requested, quantity_received

### 2.14 `discounts` / `coupons` / `campaigns`

Rule-engine-driven; `discounts.rule_json` and `coupons.rule_json` store the configurable rule definition rather than hardcoded columns per discount type, per the PRD's "no code change for new rule" requirement.

### 2.15 `tax_rules` / `eta_invoices`

- `tax_rules`: id, company_id, name, rate, applies_to (category/product scoping)
- `eta_invoices`: id, order_id, eta_uuid, submission_status, payload_json, submitted_at

### 2.16 `subscriptions` / `subscription_plans` / `license_keys` / `devices`

- `subscriptions`: id, company_id (FK, unique — one active subscription record per company), plan_id (FK → `subscription_plans`, nullable while in trial before a plan is ever chosen), status (`trialing` / `active` / `past_due` / `locked` / `canceled`), trial_started_at, trial_ends_at, current_period_start, current_period_end, locked_at (nullable), lock_reason (nullable — enum: `trial_expired` / `payment_failed` / `platform_admin_manual` / `policy_violation`), is_full_access_override (BOOLEAN, default false), override_expires_at (nullable — null = indefinite), override_reason (nullable), override_granted_by_platform_admin_id (nullable FK → `platform_admins`).
  - `status = 'trialing'` implies every feature flag in the effective plan resolves to Enterprise-equivalent regardless of `plan_id` (PRD FR-16.4) — enforced by the entitlement-resolution logic in §2.16.1, not by a special-cased `plan_id`.
  - `is_full_access_override = true` short-circuits the entitlement resolution entirely (§2.16.1) — a company with an active override behaves as fully-Enterprise-entitled and unlocked no matter what `status`/`plan_id`/`trial_ends_at` say, until the override is revoked or `override_expires_at` passes.
- `subscription_plans`: id, code (`basic`/`pro`/`enterprise` — `trial` is a `status`, never a row here, since it is not a company-selectable ongoing plan per PRD §6), name, monthly_price_egp, branch_limit (nullable = unlimited), user_limit (nullable = unlimited), feature_flags_json (module-level on/off map — e.g., `{"aiAssistant": true, "ocr": true, "fraudDetection": true, "customRoles": "partial"}`), is_active (retiring an old plan without breaking companies already on it). Data-driven rather than hardcoded per-tier `if` checks in application code, so a Platform Admin changing a company's plan (PRD FR-19.3) or the business changing pricing later never requires a code deploy.
- `license_keys`: id, company_id, key_hash, activated_at, last_validated_at, grace_period_ends_at — grace period applies only to a company with `subscriptions.status = 'active'` experiencing a temporary connectivity/payment-retry gap (PRD FR-16.3); it is unrelated to, and does not extend, `subscriptions.trial_ends_at`.
- `devices`: id, company_id, device_type (desktop/android), device_fingerprint, registered_at, last_seen_at

#### 2.16.1 Entitlement Resolution (logic reference, not a table)

The effective feature set for a company at any moment is resolved in this order (first match wins):

1. `subscriptions.is_full_access_override = true` **and** (`override_expires_at IS NULL` **or** `override_expires_at > now()`) → full Enterprise-equivalent access.
2. `subscriptions.status = 'trialing'` **and** `trial_ends_at > now()` → full Enterprise-equivalent access (PRD FR-16.4).
3. `subscriptions.status = 'active'` → the `feature_flags_json`/limits of `subscription_plans` row referenced by `plan_id`.
4. `subscriptions.status IN ('past_due')` **and** `license_keys.grace_period_ends_at > now()` → same as (3), unchanged, per the "never hard-block within grace period" rule (API.md §2.3).
5. Anything else (`status = 'locked'`, trial expired with no plan selected, grace period exhausted) → **fully locked** (PRD FR-16.5): no module entitlement resolves true except the read-only/backup/billing carve-out, which is enforced at the command layer, not via a feature flag (Security.md §6.3).

### 2.16.2 `platform_admins`

Vendor-side operator accounts — **not** rows in `users`, and never associated with any `company_id` (PRD FR-19.7).

| Column        | Type           | Notes                                                                                                |
| ------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| id            | UUID PK        |                                                                                                      |
| name, email   | TEXT           |                                                                                                      |
| password_hash | TEXT           | argon2id, per Security.md §2.1                                                                       |
| role          | TEXT           | `super_admin` (full access, per this feature) / `support` (view + limited actions, no override/lock) |
| mfa_secret    | TEXT, nullable | TOTP secret; mandatory for `super_admin` (Security.md §11)                                           |
| is_active     | BOOLEAN        |                                                                                                      |

### 2.16.3 `platform_admin_actions` (immutable, append-only, cross-tenant)

The audit trail for every action a Platform Admin takes against any Company — deliberately a **separate table from `audit_entries`** (§2.17) because these actions are not scoped to a single `company_id` the way normal tenant audit entries are, and must remain visible to Platform Admins even if the target company is later deleted/archived.

| Column                  | Type      | Notes                                                                                            |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| id                      | UUID PK   |                                                                                                  |
| platform_admin_id       | UUID FK   | who performed the action                                                                         |
| target_company_id       | UUID FK   | which company was affected                                                                       |
| action_code             | TEXT      | `plan_changed` / `override_granted` / `override_revoked` / `account_locked` / `account_unlocked` |
| reason                  | TEXT      | mandatory for every action code (PRD FR-19.3–19.5)                                               |
| before_json, after_json | JSON      | snapshot of the relevant `subscriptions` fields before/after                                     |
| occurred_at             | TIMESTAMP |                                                                                                  |

Immutability (no UPDATE/DELETE) is enforced by the same trigger pattern as `audit_entries` and `stock_movement_events` (§7).

### 2.17 `audit_entries` (immutable, append-only)

id, company_id, actor_user_id, action_code, entity_type, entity_id, before_json, after_json, occurred_at, device_id

### 2.18 AI tables: `ai_predictions`, `ai_anomalies`, `ai_health_score_snapshots`, `ai_insight_feedback`

Read-mostly, regenerated periodically by AI jobs; `ai_insight_feedback` captures owner accept/reject of recommendations (used for AI evaluation per AI.md).

## 3. Sync Collections (present on every device AND on the server)

### 3.1 `sync_outbox` (collection)

id, aggregate_type, aggregate_id, event_payload_json, created_at, sent_at (nullable), device_id

Every local Command that changes state appends here in the same local transaction as the domain write — guaranteeing nothing is ever lost even if sync never runs.

### 3.2 `sync_inbox` (collection)

id, source_device_id, event_payload_json, received_at, applied_at (nullable), apply_status (pending/applied/conflict)

### 3.3 `sync_conflicts` (collection)

id, entity_type, entity_id, local_version_json, remote_version_json, conflicting_fields_json, resolution_status (pending/auto_resolved/manual_resolved), resolved_by_user_id, resolved_at

### 3.4 `sync_cursors` (collection)

device_id, peer_device_id (or 'server'), last_acknowledged_sequence — tracks how far each device pairing has synced, enabling incremental (not full-collection) sync.

### 3.5 `device_vector_clocks` (collection)

device_id, logical_clock — supports causality ordering across the event-sourced inventory stream described in Architecture.md §6.

## 4. Relationships Summary

- One Company → many Branches, Users, Products, Customers, Suppliers (strict tenant isolation at every FK chain — every query is implicitly scoped by `company_id`).
- **Exception to strict tenant isolation:** `platform_admins` and `platform_admin_actions` (§2.16.2–2.16.3) are the one deliberate exception — a Platform Admin's queries intentionally span every `company_id`. This exception is scoped narrowly to the Platform Administration bounded context (Architecture.md §3) and is never available to any tenant-scoped role, code path, or API surface (Security.md §11).
- One Branch → one or more Warehouses (or shares a central Warehouse).
- One ProductVariant → many StockItems (one per warehouse/batch), many StockMovementEvents.
- One Order → many OrderLines, Payments, optionally Returns.
- One Customer → one LoyaltyAccount, many CreditLedgerEntries, many Orders.

## 5. Standard Columns (applied to virtually every table)

`id (UUID)`, `created_at`, `updated_at`, `created_by_device_id`, `is_deleted` (soft delete flag — see PRD assumption A4), `sync_version` (integer, incremented on every local mutation, used for field-level merge comparison).

## 6. Indexing Strategy

- All `company_id` fields indexed (tenant-scoped queries are the majority of traffic).
- `product_variants.barcode` unique index for scan lookups.
- `stock_movement_events` compound index on `{warehouse_id, product_variant_id, sequence_no}` — this is the hot path for projecting current stock.
- `orders` compound index on `{branch_id, created_at}` for reporting date-range queries.
- `sync_outbox` partial index on `{device_id, sent_at}` where `sent_at` does not exist — fast "what's pending" lookup (MongoDB sparse/partial index).
- Text index on `products.name` / `customers.name, customers.phone` for search-as-you-type.
- `subscriptions` compound index on `{status, trial_ends_at}` — hot path for the trial-reminder scheduler (Notifications.md §3) and the nightly job that transitions expired trials to `locked`.
- `platform_admin_actions` compound index on `{target_company_id, occurred_at}` — supports the per-company admin-action history shown in the Platform Admin console (UI_UX.md §2.7).
- TTL indexes on `sync_inbox` applied documents and short-lived session tokens, managed via MongoDB TTL index configuration.

## 7. Constraints & Validation

- MongoDB validation schemas (JSON Schema validators set on each collection) enforce field types, required fields, and value constraints — equivalent to SQL CHECK constraints, enforced at the database level.
- Referential integrity (e.g., `company_id` must correspond to an existing company) is enforced at the application/repository layer rather than at the database FK level; MongoDB change streams trigger projection updates (e.g., `stock_items.quantity_on_hand`) when `stock_movement_events` documents are inserted.
- Validation schema on `orders` enforces `grand_total >= 0` and `order_lines[].quantity > 0`.
- Immutability of append-only collections (`stock_movement_events`, `sync_outbox`, `audit_entries`, `platform_admin_actions`) is enforced at the repository layer — no update or delete operations are ever issued against these collections, and this is verified by contract tests.
- A pre-insert change stream hook (or application-layer guard) prevents sale of expired batches unless `override_expired_sale` permission + approval exists (maps to PRD edge case).

## 8. Migration & Versioning Strategy

- MongoDB schema is managed via **validation schemas** (JSON Schema validators on each collection) and **migration scripts** using a versioned migration runner (e.g., `migrate-mongo` or a custom runner embedded in the Infrastructure layer).
- Migration scripts are sequentially numbered and applied at app startup on Desktop/Android (local MongoDB), and via the backend's deploy pipeline for the server PostgreSQL instance.
- Every migration is backward-compatible for at least one prior app version to support staggered rollout across devices that haven't yet updated (a device on version N-1 must still be able to sync with version N until it updates).
- Local MongoDB migrations run via the migration runner embedded in the app's Infrastructure layer at startup; PostgreSQL migrations run via the backend's deploy pipeline.

## 9. Backup Architecture

- **Primary storage:** local disk backup on the device. Incremental backups capture only changed documents since the last backup snapshot, compressed (e.g., gzip) and encrypted independently of the live database encryption key (Security.md §8).
- **Secondary storage:** Supabase Storage. After each successful local backup, the encrypted backup file is uploaded to the company's designated Supabase Storage bucket. Supabase is used as the storage backend only — it is not a primary database or sync relay for backup purposes.
- **Offline queue:** when the device is offline or Supabase Storage is unreachable, the backup file is queued locally and automatically uploaded once connectivity is restored. The queue is durable — it survives app restarts.
- **Version history:** each backup file is timestamped; multiple versions are retained per the configured retention policy, allowing point-in-time restore by selecting any retained snapshot.
- **Integrity verification:** every backup includes an integrity checksum (e.g., SHA-256 of the compressed+encrypted payload) verified on restore. A failed integrity check blocks restore and surfaces a plain-language error (UI_UX.md §5) rather than silently restoring a corrupted state.
- **Restore flow:** restore is a permission-gated, confirmation-required destructive action (UI_UX.md §3 destructive-action pattern). The user can select a restore point by timestamp from either local disk or Supabase Storage. Restore remains available during trial-expired/suspended lock (Security.md §8).

---

_Database.md — feeds API.md and Sync Architecture.md._
