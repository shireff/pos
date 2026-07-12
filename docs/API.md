# API.md — Smart Retail OS API Specification

**Transport:** REST (resource operations) + WebSocket (real-time sync/notifications)
**Depends on:** Database.md, Architecture.md

## 1. Conventions

- Base URL: `https://api.<domain>/v1`
- All requests/responses: `application/json`, UTF-8.
- All list endpoints support `?page=&pageSize=` (default pageSize 25, max 200) and return:

```json
{ "data": [...], "meta": { "page": 1, "pageSize": 25, "total": 134 } }
```

- Filtering: `?filter[field]=value`, range filters `?filter[createdAt][gte]=2026-07-01`.
- Sorting: `?sort=-createdAt,name` (`-` = descending).
- Versioning: URL path versioning (`/v1`); breaking changes ship as `/v2` with `/v1` maintained per the deprecation policy in Coding Standards.md.
- Every response includes `requestId` for support/debugging correlation.

## 2. Authentication & Authorization

### 2.1 Auth flow

- `POST /v1/auth/login` — body: `{ companyCode, username, password, deviceFingerprint }` → returns `{ accessToken, refreshToken, expiresIn, user, permissions[] }`.
- `POST /v1/auth/refresh` — body: `{ refreshToken }` → new `accessToken`.
- `POST /v1/auth/logout` — invalidates refresh token; writes audit entry.
- Access tokens: short-lived JWT (15 min), signed, carrying `companyId`, `userId`, `branchRoles[]`.
- Refresh tokens: long-lived, stored hashed server-side, rotated on each use (rotation-on-use prevents replay).
- **This is the tenant auth realm only.** Platform Admin authentication is a completely separate flow (§8.1) — a tenant `accessToken` is never valid against any `/v1/platform-admin/*` endpoint and vice versa (Security.md §11).

### 2.2 Authorization

- Every protected endpoint declares required `permissionCode`(s) (e.g., `sales.create`, `inventory.adjust`, `reports.view.financial`).
- Middleware resolves the caller's effective permissions from `user_branch_roles` → `role_permissions` for the target `branchId` in the request context.
- 403 returned with the specific missing permission code (never a generic denial) so the client can explain to the user precisely what's blocked.

### 2.3 Device & License headers

Every request from a registered device includes `X-Device-Id` and `X-License-Key`. The backend validates license status per the hybrid offline/online model (Sync Architecture.md §7) but never hard-blocks requests solely due to a stale license _check_ within the grace period. This is distinct from an actually-expired 14-day trial or an explicit platform-admin suspension (§8), both of which **do** hard-block state-changing requests — see `TRIAL_EXPIRED` and `ACCOUNT_SUSPENDED` in §3.

## 3. Error Codes

Standard envelope:

```json
{ "error": { "code": "STOCK_INSUFFICIENT", "message": "...", "details": {...}, "requestId": "..." } }
```

| HTTP | Code                    | Meaning                                                                                                                   |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 400  | VALIDATION_ERROR        | Request body failed schema validation                                                                                     |
| 401  | UNAUTHENTICATED         | Missing/expired access token                                                                                              |
| 403  | PERMISSION_DENIED       | Authenticated but lacks required permission                                                                               |
| 403  | LICENSE_EXPIRED         | Grace period exhausted, tier feature blocked                                                                              |
| 403  | TRIAL_EXPIRED           | The 14-day free trial has ended and no plan has been selected/paid — all write operations blocked (§4.8, §8.4)            |
| 403  | ACCOUNT_SUSPENDED       | A Platform Admin has suspended this account (§8.4) — all write operations blocked regardless of trial/subscription status |
| 404  | NOT_FOUND               | Resource does not exist or not in caller's tenant scope                                                                   |
| 409  | CONFLICT                | Optimistic concurrency / sync_version mismatch                                                                            |
| 409  | STOCK_INSUFFICIENT      | Sale/transfer would oversell                                                                                              |
| 422  | BUSINESS_RULE_VIOLATION | e.g., selling expired batch without override                                                                              |
| 429  | RATE_LIMITED            | Throttling triggered                                                                                                      |
| 500  | INTERNAL_ERROR          | Unhandled server fault                                                                                                    |
| 503  | AI_PROVIDER_UNAVAILABLE | All configured AI providers failed; feature degrades to offline mode                                                      |

`TRIAL_EXPIRED` and `ACCOUNT_SUSPENDED` both include a `details.readOnly: true` flag when read-only endpoints remain reachable, so the client can distinguish "fully read-only lockout" from a harder block, and always include `details.upgradeUrl` / `details.contactSupportUrl` respectively so the client can render the correct call-to-action rather than a generic error (UI_UX.md §2.7).

## 4. Core Endpoints (representative set — full contract per resource lives in generated OpenAPI spec)

### 4.1 Catalog

- `GET /v1/products` — list, filterable by category/branch/stock-status.
- `POST /v1/products` — create product (+ variants array).
- `PATCH /v1/products/{id}` — partial update; requires `sync_version` in body for optimistic concurrency.
- `GET /v1/products/{id}/stock` — stock across warehouses.
- `POST /v1/products/{id}/barcode` — generate barcode.

### 4.2 Sales

- `POST /v1/orders` — create a sale. Body: `{ companyId, branchId, cashierId, clientTxnId, warehouseId, lines[], payments[], customerId?, shiftSessionId?, discountRuleIds?, couponCode? }`. Requires `sales.create`.
  - `clientTxnId` makes the endpoint idempotent — replaying an offline-queued event returns the same order.
  - Split-tender enforced: sum of `payments[].amountPiasters` must equal the computed `grandTotalPiasters` (BR-SAL-003).
  - Expired batch guard: if any line references an expired batch, returns 422 `BUSINESS_RULE_VIOLATION` with code `BR-INV-008`.
  - Bundle lines: `isBundle: true` triggers atomic component deduction; missing components stock returns `STOCK_INSUFFICIENT`.
  - Response: full order object with computed totals, tax, and receipt payload.
  - Errors: `STOCK_INSUFFICIENT`, `BUSINESS_RULE_VIOLATION`, `TRIAL_EXPIRED` / `ACCOUNT_SUSPENDED`.
- `GET /v1/orders` — paginated list. Query: `?page=&pageSize=&branchId=&cashierId=&status=&dateFrom=&dateTo=`. Requires `sales.view`.
- `GET /v1/orders/{id}` — full order detail with lines, payments, and return history. Requires `sales.view`.
- `POST /v1/orders/{id}/returns` — initiate a return. Body: `{ returnedByUserId, reason (min 5), warehouseId?, refundMethod?, refundApprovalThresholdPiasters?, lines[] }`. `lines[]` requires `orderLineId`, `productVariantId`, `productId`, `returnQuantity` (positive), `refundAmountPiasters`. Auto-approves below threshold, otherwise `pending_approval`. Requires `sales.return.create`.
- `POST /v1/orders/{id}/returns/{returnId}/approve` — approve a pending return. Restores stock inward, reverses loyalty points (BR-SAL-007), transitions return to `approved`. Requires `sales.refund.approve`.
- `POST /v1/orders/{id}/void` — void a completed order. Body: `{ voidedByUserId?, reason (min 5), currentShiftSessionId, warehouseId? }`. Same-session restriction enforced: void only within the order's shift session (BR-SAL-006). Reverses inventory outward events and loyalty accrual. Requires `sales.void`.
- `POST /v1/shifts` — open a new cashier shift. Body: `{ companyId, branchId, cashierId, openingCashPiasters }`. Requires `sales.shift.open_close`.
- `POST /v1/shifts/current/close` — close the current shift. Body: `{ companyId, branchId, cashierId, shiftSessionId, closingCashPiasters }`. Requires `sales.shift.open_close`.
- `GET /v1/shifts/current` — current shift state for the authenticated cashier. Requires `sales.view`.

Sales sync classifications: `orders`, `order_lines`, `payments`, `returns`, `return_lines` are **Class A** (append-only, never overwritten). `shift_sessions` is **Class B** (field-level HLC merge). See `packages/application-sales/src/sales-sync-classification.ts`.

### 4.3 Inventory

- `POST /v1/stock/adjustments` — manual adjustment (requires approval workflow if configured).
- `POST /v1/stock/transfers` — create transfer request.
- `POST /v1/stock/transfers/{id}/approve|ship|receive` — lifecycle transitions.
- `GET /v1/stock/movements?productVariantId=&warehouseId=` — event history (read-only, from `stock_movement_events`).

### 4.4 Purchasing

All endpoints require `purchasing.*` permissions (see Permission_Matrix.md). The purchase order state machine is
`draft → pending_approval → approved → partially_received → fully_received`, with `→ cancelled` from any
non-received state (Phase 06).

- `POST /v1/purchase-orders` — create a PO (requires `purchasing.create`). Body: `{ companyId, branchId, supplierId, expectedDeliveryDate, notes?, lines: [{ productId, variantId?, unitId, orderedQuantity, unitPricePiasters }], autoApproveThresholdPiasters? }`. Auto-submits/auto-approves when the threshold is supplied. Returns the serialized PO.
- `PATCH /v1/purchase-orders/{id}` — update draft PO header/lines (requires `purchasing.edit`).
- `GET /v1/purchase-orders` — paginated list, filterable by `status`, `supplierId`, `dateFrom`, `dateTo`.
- `GET /v1/purchase-orders/{id}` — full detail with lines and receipts.
- `POST /v1/purchase-orders/{id}/submit` — submit for approval; auto-approves when below company threshold.
- `POST /v1/purchase-orders/{id}/approve` — approve (requires `purchasing.approve`).
- `POST /v1/purchase-orders/{id}/reject` — reject with `reason` (min 10 chars) (requires `purchasing.approve`).
- `POST /v1/purchase-orders/{id}/cancel` — cancel with `reason` (requires `purchasing.edit`).
- `POST /v1/purchase-orders/{id}/receive` — record goods receipt (requires `purchasing.receive`). Body: `{ notes?, lines: [{ lineId, warehouseId, receivedQuantity, discrepancyType?, discrepancyNotes? }] }`. Emits a `PURCHASE_RECEIPT` stock movement per line and captures discrepancies (BR-SUP-002).
- `POST /v1/purchase-orders/{id}/invoice` — record supplier invoice (requires `purchasing.invoice.record`). Body: `{ supplierId, invoiceNumber, invoiceDate, totalAmountPiasters, taxAmountPiasters, attachmentUrl? }`.
- `POST /v1/purchase-orders/{id}/ocr` — upload invoice image reference → returns deterministic extracted fields for review (stub; real OCR in Phase 15). Never auto-commits (BR-SUP-003).

Sync classes: `purchase_orders` and `supplier_invoices` are **Class B** (field-level HLC merge); `goods_receipt_lines` is **Class A** (append-only, never overwritten). See Sync Architecture.md and `packages/application-sync/src/sync-classification.ts`.

### 4.5 Customers & Loyalty

- `GET /v1/customers?phone=`, `POST /v1/customers`, `POST /v1/customers/{id}/loyalty/redeem`.

### 4.6 Reports

- `GET /v1/reports/daily-sales?branchId=&date=`
- `GET /v1/reports/profit-loss?from=&to=`
- All report endpoints support `?format=json|pdf|csv` and `?schedule=` for registering a recurring delivery (see Notifications.md). Reports remain readable even during a `TRIAL_EXPIRED`/`ACCOUNT_SUSPENDED` lockout (§4.8) — a locked-out owner can always see their own historical data.

### 4.7 AI

- `POST /v1/ai/assistant/query` — `{ question, context: { branchId, dateRange } }` → routed per AI.md model-routing rules; response includes `source: "local"|"cloud"` so UI can indicate confidence/depth.
- `GET /v1/ai/predictions/sales?branchId=&horizon=week`
- `GET /v1/ai/health-score?companyId=`
- `POST /v1/ai/insights/{id}/feedback` — `{ accepted: true|false }` — feeds AI evaluation loop.

### 4.8 Licensing & Billing (Trial + Paid Plans)

- `GET /v1/subscription` — current tier/status/trial info. Response:

```json
{
  "status": "trialing" | "active" | "trial_expired" | "past_due" | "suspended",
  "planId": "free_trial" | "starter" | "growth" | "enterprise",
  "trialStartedAt": "2026-06-21T00:00:00Z",
  "trialEndsAt": "2026-07-05T00:00:00Z",
  "trialDaysRemaining": 0,
  "isReadOnlyLocked": true,
  "gracePeriodEndsAt": null
}
```

- **Trial model:** every new company starts in `status: "trialing"` for exactly **14 calendar days** from `trialStartedAt`, with **every plan tier's features unlocked** during that window (no feature gating during trial — this is a deliberate product decision so the founder's "full-featured trial" experience is genuine, not a crippled demo). No AI-endpoint or feature-flag check treats a trialing company any differently from an `enterprise` company for those 14 days.
- **On trial expiry (`trialEndsAt` passed with no active paid plan):** `status` transitions server-side to `trial_expired` and the account becomes **fully write-locked** — every state-changing endpoint (`POST`/`PATCH`/`DELETE` across every resource in §4.1–4.7, including offline-queued events pushed via `POST /v1/sync/push`, §5.1) returns `403 TRIAL_EXPIRED`. This is an intentional, harder lock than the ordinary `LICENSE_EXPIRED` grace-period behavior in §2.3 — offline-first "never block a sale" (Vision.md §5) is explicitly overridden here because an unpaid, trial-expired account is not a paying customer relying on business continuity; a device that goes offline mid-trial still respects the last-known `trialEndsAt` it synced and self-locks locally at that timestamp even without connectivity, so the lock cannot be evaded by disconnecting.
- **Read-only endpoints remain available while locked:** `GET` requests across reports, product/stock lookups, order history, and `GET /v1/subscription` itself always succeed, so an expired-trial owner can still see their data and is shown the Paywall/upgrade screen (UI_UX.md §2.7) rather than a broken app.
- `POST /v1/subscription/upgrade` — body: `{ planId, billingCycle }` — tier change / trial-to-paid conversion request; routes to payment flow (out of scope for this API doc's detail — see future Billing Integration doc). A successful upgrade transitions `status` to `active` and immediately lifts the write-lock, including for any devices that were locally self-locked while offline (they unlock on next successful sync/pull).
- `POST /v1/devices/register` — bind a new device to the company license.

### 4.9 Discounts, Coupons & Taxes (Phase 11)

All endpoints below require the permissions noted per operation.

#### Discount Rules

- `GET /v1/discount-rules?companyId=&type=&isActive=` — list active discount rules. Supports filtering by `type` (`item` | `cart` | `category` | `customer` | `membership` | `time_based` | `buy_x_get_y` | `quantity_break`) and `isActive`. Requires `promotions.discount.view`.
- `POST /v1/discount-rules` — create a discount rule. Body: `{ companyId, name, type, ruleJson, validFrom?, validUntil?, priority?, isExclusive? }`. `ruleJson` is a type-discriminated object that defines the rule parameters (e.g., `productIds`, `categoryIds`, `discountType`, `amount`, `tiers[]`, `timeRange`, etc.). Requires `promotions.discount.create`.
- `PATCH /v1/discount-rules/{id}` — partial update. Body accepts any of `{ name, ruleJson, priority, isExclusive }`. Requires `promotions.discount.edit`.
- `POST /v1/discount-rules/{id}/deactivate` — sets `isActive = false`. Requires `promotions.discount.edit`.

#### Coupons

- `GET /v1/coupons?companyId=` — list all coupons for the company. Requires `promotions.coupon.view`.
- `POST /v1/coupons` — create a coupon. Body: `{ companyId, code, discountType, amount, isMultiUse?, usageLimit?, expiresAt?, scopeType, scopeIds[] }`. `discountType` is `percentage` or `fixed`; `scopeType` is `global` | `product` | `category`. Requires `promotions.coupon.create`.
- `POST /v1/coupons/validate` — validate a coupon against a cart context. Body: `{ code, companyId, cartTotalPiasters, customerId?, lineItems? }`. Response: `{ valid, couponId, discountAmountPiasters, reason? }`. No permission required (used at checkout).

#### Tax Rules

- `GET /v1/tax-rules?companyId=` — list active tax rules, sorted by `priority`. Requires `tax.rules.view`.
- `POST /v1/tax-rules` — create a tax rule. Body: `{ companyId, name, rateBasisPoints, appliesTo, scopeIds[], priority? }`. `rateBasisPoints` is stored internally; `ratePercent = rateBasisPoints / 100`. `appliesTo` is `all` | `category` | `product`. Requires `tax.rules.edit`.

#### Price Changes

- `POST /v1/price-changes` — request a price change. Body: `{ companyId, productId, variantId?, oldPricePiasters, newPricePiasters, notes?, autoApproveThresholdPiasters? }`. When `abs(newPricePiasters - oldPricePiasters) <= autoApproveThresholdPiasters`, the change is auto-approved; otherwise status is `pending_approval`. Requires `pricing.change`.
- `POST /v1/price-changes/{id}/approve` — approve a pending price change. Requires `pricing.change.approve`.
- `POST /v1/price-changes/{id}/reject` — reject a pending price change. Requires `pricing.change.approve`.

Sync classes: `discount_rules`, `coupons`, and `tax_rules` are **Class B** (field-level HLC merge). `coupon_usages` is **Class A** (append-only, never overwritten). `price_changes` is **Class B**.

### 4.10 Notifications (Phase 14)

- `GET /v1/notifications` — paginated, **unread-first** list for the authenticated user. Query: `?isRead=true|false`, `?category=` (`INVENTORY` | `APPROVALS` | `SYNC` | `AI_INSIGHTS` | `BILLING_TRIAL` | `REPORTS` | `SECURITY` | `GENERAL`), `?limit=` (default 50). Response: `{ success, data: SerializedNotification[] }` (newest first within unread-then-read ordering). `title`/`body` are rendered in the request locale from each notification's i18n keys.
- `POST /v1/notifications/{id}/read` — mark a single notification read. Returns `{ success, data: { id, isRead: true } }`. `404` if the notification does not belong to the caller.
- `GET /v1/notification-preferences` — current user's per-category/per-channel preference rows: `{ success, data: NotificationPreferenceRow[] }`.
- `PUT /v1/notification-preferences` — replace preferences. Body is an array of `{ category, channel ('IN_APP'|'PUSH'|'EMAIL'), frequency ('IMMEDIATE'|'HOURLY_DIGEST'|'DAILY_DIGEST'), isEnabled }`. Returns the saved rows. Billing & Trial category cannot be muted in the final 4 days of trial (BR-NOT-004).

`SerializedNotification`:

```json
{
  "id": "string", "companyId": "string", "recipientUserId": "string",
  "triggerCode": "string", "category": "string", "priority": "CRITICAL|HIGH|MEDIUM|LOW",
  "title": "string", "body": "string", "actionUrl": "string|null",
  "referenceType": "string|null", "referenceId": "string|null",
  "isRead": false, "isDismissed": false, "createdAt": "ISO-8601"
}
```

Notifications are **event-driven**: no feature code emits a notification directly — every notification is produced by the shared EventBus dispatcher (`packages/application/notifications`) in response to a domain event (BR-NOT-001). Priority gating (CRITICAL/HIGH immediate; MEDIUM → hourly digest; LOW → daily digest) and the rate limiter (duplicate suppression + per-user daily cap, with Billing & Trial exempt) live in that layer (see Notifications.md). The in-app record is the source of truth; a channel (push/email) delivery failure never removes it (BR-NOT-006).

---

## 5. Sync APIs

### 5.1 Event push / pull (transport layer)

Outbound and inbound event propagation is performed by the sync **transport layer**
(`packages/infrastructure/sync`), not by a REST `push`/`pull` endpoint. The engine
selects the best available transport automatically (see Sync Architecture.md §5):

- **LAN transport** — mDNS device discovery on the local network plus a direct WebSocket peer channel, delivering events with zero cloud round-trip.
- **Supabase Realtime transport** — publish/subscribe on a company-scoped channel when devices are on different networks.
- **WebSocket fallback** — a standard WebSocket relay to the backend when Supabase Realtime is unavailable, with auto-reconnect and exponential backoff.

The outbox/inbox pattern makes every event idempotent by `eventId`: a replayed,
already-applied event is a no-op and a duplicate outbox entry is never created.
(The earlier REST `POST /v1/sync/push` + `GET /v1/sync/pull` contract was superseded
by this transport model during implementation; the design intent — idempotent
duplicate handling and bounded paginated backlog pull for offline catch-up — is
preserved by the inbox processor and the `BacklogPaginator`.)

### 5.2 Status

`GET /v1/sync/status?companyId=`

Returns the current sync state of the caller's company:

```json
{ "success": true, "data": { "companyId": "...", "pendingOutbox": 0, "pendingInbox": 0, "lastSyncedAt": null, "transportType": "websocket", "offline": false } }
```

`transportType` is `supabase_realtime` when `SUPABASE_URL` is configured, otherwise `websocket`. `offline` is always `false` server-side (the relay is reachable); the client's own offline state is tracked locally.

### 5.3 Conflict resolution

- `GET /v1/sync/conflicts?companyId=&limit=20&offset=0` — paginated unresolved conflicts. Response: `{ success, data: [{ id, companyId, entityType, entityId, field, localValue, remoteValue, status, createdAt }], pagination: { limit, offset } }`.
- `POST /v1/sync/conflicts/{id}/resolve` — body `{ "winner": "local" | "remote" | "merge", "resolvedValue"?: <any> }`. Applies the winning value back to the owning entity, records the resolution in the conflict's audit trail (the resolving user is taken from the `x-actor-id` request header), and returns `{ success, data: { id, status, field, auditTrail } }`. Resolving an already-resolved conflict returns `404`.

### 5.4 WebSocket channel

`wss://api.<domain>/v1/sync/stream?deviceId=&token=`
Server pushes new events in near-real-time when the device is online, instead of requiring the device to poll `pull`. Falls back to polling `pull` automatically if the WebSocket connection drops (documented fallback behavior in Sync Architecture.md §5). The stream also pushes a `subscription.status_changed` event immediately when a Platform Admin changes an account's plan or suspension state (§8.3), so an online device reflects a lock/unlock without waiting for its next poll cycle.

## 6. Rate Limiting

- Per-device: 600 requests/minute burst, 100/minute sustained — generous enough for a busy single register's sync traffic, protective against runaway retry loops.
- AI endpoints rate-limited separately and more conservatively (per Pro/Enterprise tier quotas) since they proxy to paid-by-usage providers.
- Platform Admin endpoints (§8) are rate-limited per admin account, far more conservatively (30 requests/minute), since they are low-volume, high-privilege operations — a burst here is itself a signal worth an alert (Security.md §11).
- **Notification delivery** is rate-limited inside the EventBus dispatcher (§4.10), independent of the request limits above: identical notifications for the same user/category within a 10-minute window are de-duplicated; beyond a per-user daily cap the rest are folded into a single summary; **Billing & Trial** notifications are exempt from the cap (BR-NOT-004). CRITICAL/HIGH (safety) notifications always dispatch immediately and are never batched.

## 7. Pagination, Filtering, Versioning — Cross-Cutting Rules

Already defined in §1; applied uniformly across every list endpoint without exception, so client code (Desktop/Android) can share one generic pagination/query-building utility rather than per-endpoint logic. Platform Admin list endpoints (§8.2) reuse the exact same pagination/filtering/sorting conventions.

## 8. Platform Administration API

**Base path:** `https://admin-api.<domain>/v1` — deliberately a **separate host/subdomain** from the tenant API (`api.<domain>`), not just a separate path prefix, so tenant-facing infrastructure (WAF rules, rate limits, TLS certs) can be configured independently and a tenant-side outage/incident never automatically implicates the admin surface or vice versa. Every endpoint below requires a Platform Admin session (§8.1); none are reachable with a tenant `accessToken` under any circumstance (Security.md §11).

### 8.1 Platform Admin authentication

- `POST /v1/platform-admin/auth/login` — body: `{ email, password }` → if credentials are valid, returns a short-lived `mfaChallengeToken` (never a full session) — MFA is mandatory for every Platform Admin account, no exceptions, no "remember this device" bypass (Security.md §11).
- `POST /v1/platform-admin/auth/mfa/verify` — body: `{ mfaChallengeToken, code }` → returns `{ adminAccessToken, adminRefreshToken, expiresIn }`. `adminAccessToken` is a structurally distinct JWT (different signing key, different `aud` claim: `platform-admin`) from a tenant `accessToken`, so a token confusion/replay attack across the two realms is not just policy-forbidden but cryptographically impossible.
- `POST /v1/platform-admin/auth/logout` — invalidates the admin refresh token; writes a `platform_admin_actions` entry (Architecture.md §3.1).
- Five consecutive failed login or MFA attempts locks the Platform Admin account for 15 minutes and immediately notifies all other active Platform Admin accounts (Notifications.md §3) — there is no self-service unlock.

### 8.2 Accounts (tenant companies)

- `GET /v1/platform-admin/accounts` — list/search all tenant companies. Supports `?filter[status]=trialing|active|trial_expired|past_due|suspended`, `?filter[planId]=`, `?search=` (company name/owner email/phone), plus the standard pagination/sorting rules (§1, §7).
- `GET /v1/platform-admin/accounts/{companyId}` — full account detail: current plan, subscription status/history, trial dates, device count, last-sync timestamp per device, MRR contribution, and a link to that account's `platform_admin_actions` history (never its tenant-facing `audit_entries`, which stay tenant-private, §3.1).

### 8.3 Plan & status overrides

- `PATCH /v1/platform-admin/accounts/{companyId}/plan` — body: `{ planId, reason }` — changes a tenant's plan immediately (upgrade, downgrade, or move to a custom/comped plan). `reason` is mandatory free text, always stored verbatim in `platform_admin_actions`.
- `POST /v1/platform-admin/accounts/{companyId}/trial/extend` — body: `{ newTrialEndsAt, reason }` — the only sanctioned way to extend or shorten a trial outside the standard 14 days (e.g., a goodwill extension); mandatory `reason`.
- `POST /v1/platform-admin/accounts/{companyId}/suspend` — body: `{ reason }` — immediately sets `status: "suspended"` regardless of trial/paid state; behaves identically to `TRIAL_EXPIRED` from the tenant's perspective (§4.8) — full write-lock, read-only preserved — but is a distinct status and error code (`ACCOUNT_SUSPENDED`) so the client can show "your account was suspended, contact support" rather than an upgrade prompt.
- `POST /v1/platform-admin/accounts/{companyId}/reactivate` — body: `{ reason }` — reverses a suspension, restoring the account's prior plan/status.
- Every one of these four endpoints is what §3.1 (Architecture.md) means by "the only commands permitted to target a `company_id` other than the caller's own" — this is enforced at the domain/command layer, not just by route placement, per the same non-negotiable-guardrail philosophy as tenant permission enforcement (Security.md §4).

### 8.4 Interaction with tenant-facing error codes

- `trial_expired` and `suspended` account statuses surface to the tenant exclusively via `TRIAL_EXPIRED` / `ACCOUNT_SUSPENDED` (§3, §4.8) — the tenant client never learns _which_ Platform Admin action caused a suspension, nor sees `platform_admin_actions` content; it only sees its own current status and, for suspension, a support-contact call to action.

### 8.5 Admin action audit

- `GET /v1/platform-admin/audit?accountId=&adminUserId=&from=&to=` — read-only view over `platform_admin_actions` (Database.md), itself append-only/immutable at the database layer identical in spirit to tenant `audit_entries` (Security.md §5) but a fully separate table and fully separate permission surface — no tenant, however privileged, can ever query this endpoint.

---

_API.md — feeds Sync Architecture.md (protocol detail) and AI.md (endpoint contracts). §8 (Platform Administration API) is the one section of this document describing a vendor-internal, non-tenant-facing surface._
