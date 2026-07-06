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

- `POST /v1/orders` — create a sale.
  - Request:

```json
{
  "branchId": "...",
  "lines": [{ "productVariantId": "...", "quantity": 2, "unitPrice": 1500 }],
  "payments": [{ "tenderType": "cash", "amount": 3000 }],
  "customerId": null,
  "clientTxnId": "uuid-generated-offline"
}
```

- `clientTxnId` makes the endpoint idempotent — critical for offline queued syncs replaying after reconnect.
- Response: full order object with computed totals, tax, and receipt payload.
- Errors: `STOCK_INSUFFICIENT`, `BUSINESS_RULE_VIOLATION` (e.g., expired batch), `TRIAL_EXPIRED`/`ACCOUNT_SUSPENDED` when locked (§4.8).
- `POST /v1/orders/{id}/returns` — process a return; may require `refund.approve` permission depending on threshold config.

### 4.3 Inventory

- `POST /v1/stock/adjustments` — manual adjustment (requires approval workflow if configured).
- `POST /v1/stock/transfers` — create transfer request.
- `POST /v1/stock/transfers/{id}/approve|ship|receive` — lifecycle transitions.
- `GET /v1/stock/movements?productVariantId=&warehouseId=` — event history (read-only, from `stock_movement_events`).

### 4.4 Purchasing

- `POST /v1/purchase-orders`, `POST /v1/purchase-orders/{id}/approve`, `POST /v1/purchase-orders/{id}/receive`.
- `POST /v1/supplier-invoices/ocr` — upload invoice image → returns parsed line items for review (see AI.md).

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

## 5. Sync APIs

### 5.1 Push local events to server

`POST /v1/sync/push`

```json
{
  "deviceId": "...",
  "events": [
    { "aggregateType": "StockMovementEvent", "aggregateId": "...", "sequenceNo": 1042, "payload": {...} }
  ]
}
```

Response confirms which events were accepted, which were duplicates (idempotent by `sequenceNo` + `deviceId`), and which triggered a conflict record. When the caller's subscription is `trial_expired` or `suspended`, the entire push is rejected with `403 TRIAL_EXPIRED`/`403 ACCOUNT_SUSPENDED` rather than partially applied — a locked account never accumulates further server-side state via sync while locked.

### 5.2 Pull remote events

`GET /v1/sync/pull?since=<lastAcknowledgedSequence>&deviceId=...`
Returns an ordered batch of events from other devices/the server the caller hasn't yet applied, paginated for large backlogs (e.g., a device offline for weeks). Pull always remains available even when locked (§4.8), since it is read-only from the calling device's perspective and is how a device learns its current `subscriptionStatus` in the first place.

### 5.3 Conflict resolution

- `GET /v1/sync/conflicts?status=pending`
- `POST /v1/sync/conflicts/{id}/resolve` — `{ resolution: "keep_local"|"keep_remote"|"merged", mergedPayload }`

### 5.4 WebSocket channel

`wss://api.<domain>/v1/sync/stream?deviceId=&token=`
Server pushes new events in near-real-time when the device is online, instead of requiring the device to poll `pull`. Falls back to polling `pull` automatically if the WebSocket connection drops (documented fallback behavior in Sync Architecture.md §5). The stream also pushes a `subscription.status_changed` event immediately when a Platform Admin changes an account's plan or suspension state (§8.3), so an online device reflects a lock/unlock without waiting for its next poll cycle.

## 6. Rate Limiting

- Per-device: 600 requests/minute burst, 100/minute sustained — generous enough for a busy single register's sync traffic, protective against runaway retry loops.
- AI endpoints rate-limited separately and more conservatively (per Pro/Enterprise tier quotas) since they proxy to paid-by-usage providers.
- Platform Admin endpoints (§8) are rate-limited per admin account, far more conservatively (30 requests/minute), since they are low-volume, high-privilege operations — a burst here is itself a signal worth an alert (Security.md §11).

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
