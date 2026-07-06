# Error_Catalog.md — Smart Retail OS Centralized Error Catalog

**Depends on:** API.md §3, Coding_Standards.md §5 (Result type vs. exceptions), Security.md, UI_UX.md §5, AI.md
**Feeds into:** UI_UX.md §5 (error/empty states — every code below maps to plain-language, role-appropriate copy), Testing.md §3/§8/§9 (error-path tests)
**Governing rule:** Every error returned to a client uses the standard envelope from API.md §3: `{ "error": { "code", "message", "details", "requestId" } }`. Domain/Application layers never throw for expected business-rule failures — they return `Result<T, DomainError>` (Coding_Standards.md §5); the mapping from `DomainError.code` to HTTP status is a single translation table at the API boundary, never duplicated per-controller. A raw stack trace or technical string is never shown to an end user (UI_UX.md §5) — every code has a mapped plain-language, localized message.

## 1. How to Read This Catalog

Each entry: **Code**, **Category**, **HTTP Mapping** (if applicable — some codes are client-local/domain-only and never cross the API boundary), **Message** (developer-facing, English, stable string), **Cause**, **Recovery Steps**, **User Message** (the plain-language copy shown per UI_UX.md §5, in the active language), **Developer Notes**, **Logging Level** (Coding_Standards.md §6), **Retry Policy**, **Localization Requirements**.

## 2. Authentication & Session Errors

### UNAUTHENTICATED

- **Category:** Auth
- **HTTP:** 401
- **Message:** "Missing or expired access token."
- **Cause:** No token, expired JWT, or invalid signature.
- **Recovery:** Client attempts silent refresh via `POST /v1/auth/refresh`; on refresh failure, force re-login.
- **User Message:** "Your session has expired. Please log in again."
- **Developer Notes:** Never distinguish "expired" vs. "invalid" in the client-facing message (avoids leaking token-forgery signal).
- **Logging Level:** `info` (routine token expiry) — escalate to `warn` if refresh also fails repeatedly for the same device.
- **Retry Policy:** One silent refresh attempt; no automatic retry after that.
- **Localization:** Required (ar/en).

### REFRESH_TOKEN_REUSE_DETECTED

- **Category:** Auth
- **HTTP:** 401
- **Message:** "Refresh token was already used; possible token theft."
- **Cause:** A rotated-out refresh token was replayed (Security.md §2.1).
- **Recovery:** Immediately invalidate all sessions for the affected user; force full re-login; write an `audit_entries` record.
- **User Message:** "For your security, you've been logged out. Please log in again."
- **Developer Notes:** This is a security signal, not routine expiry — always logged distinctly from `UNAUTHENTICATED`.
- **Logging Level:** `warn`.
- **Retry Policy:** None — full re-authentication required.
- **Localization:** Required.

### OFFLINE_AUTH_NO_PRIOR_LOGIN

- **Category:** Auth
- **HTTP:** N/A (client-local; never crosses the API boundary)
- **Message:** "No cached credential for this user on this device."
- **Cause:** User has never authenticated online at least once on this device (Security.md §2.2).
- **Recovery:** Require online login first; offline login is unavailable until then.
- **User Message:** "This account hasn't been used on this device before. Please connect to the internet to log in the first time."
- **Developer Notes:** Distinct from a wrong-PIN failure — this is "no local record exists at all."
- **Logging Level:** `info`.
- **Retry Policy:** N/A.
- **Localization:** Required.

### SESSION_TIMEOUT_OFFLINE

- **Category:** Auth
- **HTTP:** N/A (client-local)
- **Message:** "Local offline session expired."
- **Cause:** Configured local session timeout elapsed with no activity (Security.md §2.2).
- **Recovery:** Re-prompt for PIN/password; no connectivity required.
- **User Message:** "Session timed out. Please re-enter your PIN."
- **Developer Notes:** N/A.
- **Logging Level:** `info`.
- **Retry Policy:** N/A.
- **Localization:** Required.

## 3. Authorization Errors

### PERMISSION_DENIED

- **Category:** Authorization
- **HTTP:** 403
- **Message:** "Authenticated but lacks required permission: {permissionCode}."
- **Cause:** Caller's effective `user_branch_roles` → `role_permissions` resolution for the target branch does not include the required code (Security.md §4).
- **Recovery:** None automatic — surfaced to the user; an approval-workflow path may exist for some actions (see `APPROVAL_REQUIRED` below).
- **User Message:** "You don't have permission to do this. Contact your manager if you think this is a mistake." (never shows the raw permission code to non-technical roles; may show it in a developer/support-facing context)
- **Developer Notes:** `details.permissionCode` is always populated (API.md §2.2) — never a generic denial.
- **Logging Level:** `info` (routine) — pattern of repeated denials for the same user may separately feed a fraud/anomaly signal.
- **Retry Policy:** N/A — not a transient failure.
- **Localization:** Required.

### PLATFORM_ADMIN_TOKEN_REJECTED

- **Category:** Authorization
- **HTTP:** 401
- **Message:** "Tenant access token rejected by Platform Admin endpoint (or vice versa)."
- **Cause:** `aud` claim mismatch between token realm and endpoint realm (Security.md §11.1).
- **Recovery:** None — this is a structural rejection, not a retryable condition.
- **User Message:** N/A (this should never reach an end-user-facing surface; it indicates a client bug or an attempted cross-realm call).
- **Developer Notes:** Logged distinctly since it should never legitimately occur — a non-zero rate is itself an alert-worthy signal.
- **Logging Level:** `error`.
- **Retry Policy:** None.
- **Localization:** Not applicable (developer/security-facing only).

## 4. Licensing & Subscription Errors

### LICENSE_EXPIRED

- **Category:** Licensing
- **HTTP:** 403
- **Message:** "Grace period exhausted; tier feature blocked."
- **Cause:** `license_keys.grace_period_ends_at` passed without successful re-validation, for a company on a paid plan (Security.md §6.2, API.md §3).
- **Recovery:** Successful license re-validation on next connectivity restores full access; core offline POS/inventory functions are the last thing gated (Security.md §6.2).
- **User Message:** "We couldn't confirm your subscription. Please connect to the internet to continue using this feature."
- **Developer Notes:** Distinct from `TRIAL_EXPIRED` — this is a connectivity/validation gap on an otherwise paying account, not a business-model lock.
- **Logging Level:** `warn`.
- **Retry Policy:** Automatic re-validation on next connectivity; exponential backoff per Sync_Architecture.md §8 pattern.
- **Localization:** Required.

### TRIAL_EXPIRED

- **Category:** Licensing
- **HTTP:** 403
- **Message:** "The 14-day free trial has ended and no plan has been selected/paid."
- **Cause:** `trialEndsAt` passed with `subscriptions.status` still lacking an active paid plan (API.md §3, §4.8).
- **Recovery:** Owner selects and pays for a plan via `POST /v1/subscription/upgrade`; unlocks immediately, including for devices that were locally self-locked offline (BR-LIC-009).
- **User Message:** "Your 14-day trial has ended. Choose a plan to keep using [Company Name]'s data." + plan comparison CTA (UI_UX.md §2.7).
- **Developer Notes:** `details.readOnlyLocked: true` and `details.upgradeUrl` are always included (API.md §3). This is a deliberate, intentional override of the offline-first "never block a sale" guarantee (Security.md §6.2) — do not treat as a bug to "fix" by softening it.
- **Logging Level:** `info` (expected lifecycle event, not a fault).
- **Retry Policy:** None — resolved only by an explicit upgrade action, never a passive retry.
- **Localization:** Required.

### ACCOUNT_SUSPENDED

- **Category:** Licensing
- **HTTP:** 403
- **Message:** "A Platform Admin has suspended this account."
- **Cause:** `POST /v1/platform-admin/accounts/{id}/suspend` was executed against this company (API.md §8.3).
- **Recovery:** Only a Platform Admin `reactivate` action resolves this — never a self-service payment flow (UI_UX.md §2.7 distinguishes this from `TRIAL_EXPIRED`'s plan-picker CTA).
- **User Message:** "Your account has been suspended. Please contact support." + support-contact CTA (never a plan picker).
- **Developer Notes:** `details.contactSupportUrl` always included (API.md §3). The tenant never learns which admin action or reason caused it (API.md §8.4).
- **Logging Level:** `info` (from the tenant side); the originating Platform Admin action is separately logged in `platform_admin_actions` at `warn`/`info` per the action's own audit trail.
- **Retry Policy:** None.
- **Localization:** Required.

### SUBSCRIPTION_UPGRADE_NOT_OWNER

- **Category:** Licensing
- **HTTP:** 403
- **Message:** "Only the Owner role may perform a subscription upgrade."
- **Cause:** A non-Owner user invoked `POST /v1/subscription/upgrade` (PRD FR-16.7, BR-LIC-012).
- **Recovery:** Redirect the requester to ask the Owner; not resolvable by the requester directly.
- **User Message:** "Only the account owner can change the subscription plan."
- **Developer Notes:** This permission is never assignable, even via a custom role.
- **Logging Level:** `info`.
- **Retry Policy:** N/A.
- **Localization:** Required.

## 5. Validation & Business Rule Errors

### VALIDATION_ERROR

- **Category:** Validation
- **HTTP:** 400
- **Message:** "Request body failed schema validation."
- **Cause:** Missing required field, wrong type, out-of-range value.
- **Recovery:** Client corrects the request; `details` includes per-field violation info.
- **User Message:** Field-level inline messages (UI_UX.md §4), never a generic "something went wrong."
- **Developer Notes:** Server-side re-validation always occurs even when client-side validation already passed (UI_UX.md §4 — UI validation is convenience, never the sole gate).
- **Logging Level:** `info`.
- **Retry Policy:** N/A — requires a corrected request.
- **Localization:** Required (field labels and messages both).

### BUSINESS_RULE_VIOLATION

- **Category:** Business Rule
- **HTTP:** 422
- **Message:** "e.g., selling expired batch without override."
- **Cause:** Any domain invariant violation that isn't a simple field-validation issue (e.g., discount exceeds line subtotal, expired batch sale without approval, loyalty redemption exceeding balance).
- **Recovery:** Depends on the specific rule — some (like expired-batch sale) have an owner-configurable override + approval path (BR-INV-008).
- **User Message:** Rule-specific plain-language explanation (e.g., "This batch has expired and cannot be sold without manager approval.").
- **Developer Notes:** `details.ruleCode` should sub-classify the specific violated `Business_Rules.md` ID where feasible (e.g., `BR-INV-008`) to aid support diagnosis without leaking internals to the end user.
- **Logging Level:** `info`.
- **Retry Policy:** N/A — requires a corrected action or an approval.
- **Localization:** Required.

### STOCK_INSUFFICIENT

- **Category:** Business Rule
- **HTTP:** 409
- **Message:** "Sale/transfer would oversell."
- **Cause:** Requested quantity exceeds available stock for a product/variant/batch, including a bundle component shortfall (BR-INV-004).
- **Recovery:** Reduce quantity, or (for bundles) resolve the specific insufficient component shown in `details.componentVariantId`.
- **User Message:** "Not enough stock for {productName}. Available: {quantity}." For bundles: "Cannot complete: {componentName} is out of stock."
- **Developer Notes:** Never oversells silently — this is a hard block, not a warning, at the point of sale (BR-INV-004, BR-SYN-010).
- **Logging Level:** `info`.
- **Retry Policy:** N/A.
- **Localization:** Required.

### DISCOUNT_EXCEEDS_SUBTOTAL

- **Category:** Business Rule
- **HTTP:** 422 (`BUSINESS_RULE_VIOLATION` sub-case)
- **Message:** "Discount amount exceeds line subtotal."
- **Cause:** A discount rule computed a value greater than the line it applies to (BR-PRC-003).
- **Recovery:** Cap the discount or correct the rule configuration.
- **User Message:** "This discount is larger than the item's price and can't be applied."
- **Developer Notes:** Enforced at both UI and domain-command layer.
- **Logging Level:** `info`.
- **Retry Policy:** N/A.
- **Localization:** Required.

### APPROVAL_REQUIRED

- **Category:** Business Rule / Workflow
- **HTTP:** 202 (Accepted, pending) — not a hard failure; the action is queued, not rejected
- **Message:** "Action requires approval per configured workflow threshold."
- **Cause:** A discount, refund, stock adjustment, price change, PO, or transfer exceeded a configured auto-approve threshold (PRD FR-2.6).
- **Recovery:** N/A from the requester's side — the item enters the approval queue; the requester's screen shows "Submitted — pending approval" immediately (UI_UX.md §3).
- **User Message:** "Submitted — pending approval from {approverRole}."
- **Developer Notes:** This is not truly an "error" in the failure sense — documented here because it is a structured, coded outcome distinct from unconditional success, and the Notification Dispatcher fires the corresponding trigger atomically with this response (Notifications.md §6, BR-NOT-005).
- **Logging Level:** `info`.
- **Retry Policy:** N/A.
- **Localization:** Required.

## 6. Resource & Concurrency Errors

### NOT_FOUND

- **Category:** Resource
- **HTTP:** 404
- **Message:** "Resource does not exist or not in caller's tenant scope."
- **Cause:** Invalid ID, or the resource belongs to a different `company_id` (tenant isolation — Database.md §4).
- **Recovery:** Verify the ID; a cross-tenant lookup attempt is treated identically to a nonexistent resource (never leaks existence across tenants).
- **User Message:** "We couldn't find that. It may have been removed."
- **Developer Notes:** Deliberately indistinguishable from "genuinely doesn't exist" vs. "exists in another tenant," to avoid tenant-enumeration leakage.
- **Logging Level:** `info`.
- **Retry Policy:** N/A.
- **Localization:** Required.

### CONFLICT

- **Category:** Concurrency
- **HTTP:** 409
- **Message:** "Optimistic concurrency / sync_version mismatch."
- **Cause:** A `PATCH` request supplied a stale `sync_version` (API.md §4.1).
- **Recovery:** Client re-fetches the current record and re-applies the intended change, or the change is queued as a Sync conflict if it originated from an offline write (Sync_Architecture.md §5).
- **User Message:** "This item was updated elsewhere. Please review the latest version before saving."
- **Developer Notes:** Distinct from a true sync conflict (`sync_conflicts` row) — this is the synchronous API-layer optimistic-lock case, typically for two near-simultaneous _online_ edits.
- **Logging Level:** `info`.
- **Retry Policy:** Client-driven re-fetch-and-retry; not automatic.
- **Localization:** Required.

### SYNC_CONFLICT_PENDING

- **Category:** Concurrency / Sync
- **HTTP:** N/A (surfaced via `GET /v1/sync/conflicts`, not as a request-time error)
- **Message:** "Same field changed concurrently on two devices; manual resolution required."
- **Cause:** Sync_Architecture.md §3.2 true-conflict rule.
- **Recovery:** `POST /v1/sync/conflicts/{id}/resolve` with `keep_local`/`keep_remote`/`merged`.
- **User Message:** Conflict Review UI shows both values side-by-side with device/user/time attribution (Sync_Architecture.md §5).
- **Developer Notes:** Role/permission-field conflicts always escalate to Owner regardless of who could otherwise resolve (BR-PER-006).
- **Logging Level:** `warn` (rare by design; a high rate suggests a workflow or connectivity problem worth investigating).
- **Retry Policy:** N/A — requires human resolution.
- **Localization:** Required.

## 7. Rate Limiting & Availability Errors

### RATE_LIMITED

- **Category:** Rate Limiting
- **HTTP:** 429
- **Message:** "Throttling triggered."
- **Cause:** Per-device (600/min burst, 100/min sustained) or per-admin (30/min) limit exceeded (API.md §6).
- **Recovery:** Client backs off per `Retry-After` header.
- **User Message:** Generally invisible to the end user (handled transparently by client retry logic); if surfaced: "Please wait a moment and try again."
- **Developer Notes:** AI endpoints are rate-limited separately and more conservatively per tier quota.
- **Logging Level:** `warn` if sustained/repeated for the same device (may indicate a retry-loop bug); `info` for isolated bursts.
- **Retry Policy:** Exponential backoff with jitter (Sync_Architecture.md §8 pattern reused).
- **Localization:** Required (for the rare surfaced case).

### INTERNAL_ERROR

- **Category:** System
- **HTTP:** 500
- **Message:** "Unhandled server fault."
- **Cause:** Any exception not mapped to a known `DomainError` — a true programmer error or infrastructure failure (Coding_Standards.md §5).
- **Recovery:** Retried by the client per standard backoff; if persistent, surfaced to support via `requestId`.
- **User Message:** "Something went wrong on our end. Please try again — if this keeps happening, contact support and mention code {requestId}."
- **Developer Notes:** Never leaked as a raw stack trace (Coding_Standards.md §5); every occurrence is logged with full context server-side.
- **Logging Level:** `error`.
- **Retry Policy:** Client-driven retry with backoff; not infinite.
- **Localization:** Required (the wrapper text; `requestId` itself is not localized).

### AI_PROVIDER_UNAVAILABLE

- **Category:** AI / Availability
- **HTTP:** 503
- **Message:** "All configured AI providers failed; feature degrades to offline mode."
- **Cause:** Groq and Gemini Flash both failed/timed out, and local model either isn't applicable to the query complexity or also failed (AI.md §1).
- **Recovery:** Automatic fallback chain exhausted; feature falls back to local-only or a graceful "unavailable" state.
- **User Message:** "AI insights aren't available right now. Try again later, or continue without them — the rest of the app works normally."
- **Developer Notes:** Never blocks any non-AI functionality — AI features are additive, and their unavailability must not cascade into POS/inventory failures (Vision.md §5, Architecture.md dependency isolation).
- **Logging Level:** `warn`.
- **Retry Policy:** Automatic fallback chain already attempted before this code is returned; client may allow manual retry.
- **Localization:** Required.

## 8. AI-Specific Errors (Domain-Internal, Not Always HTTP-Facing)

### AI_SCHEMA_VALIDATION_FAILED

- **Category:** AI
- **HTTP:** N/A (internal; results in one retry, then `AI_RESPONSE_DEGRADED` to the client)
- **Message:** "AI provider response failed schema validation."
- **Cause:** LLM returned malformed/off-schema output (AI.md §2).
- **Recovery:** Exactly one automatic retry; if it fails again, degrade gracefully (BR-AI-006).
- **User Message:** N/A at this stage (internal retry is invisible to the user).
- **Developer Notes:** Never shown raw/garbled to the user under any circumstance.
- **Logging Level:** `warn`.
- **Retry Policy:** Exactly one retry, then stop.
- **Localization:** N/A (internal).

### AI_RESPONSE_DEGRADED

- **Category:** AI
- **HTTP:** 200 (with a degraded-content flag) or 503 depending on severity
- **Message:** "Couldn't compute that — try rephrasing."
- **Cause:** Retry (per `AI_SCHEMA_VALIDATION_FAILED`) also failed.
- **Recovery:** User rephrases or tries again later.
- **User Message:** "I couldn't work that out. Try rephrasing your question, or ask something more specific."
- **Developer Notes:** This is the final graceful fallback, never a raw error dump.
- **Logging Level:** `warn`.
- **Retry Policy:** User-initiated only.
- **Localization:** Required, and must match the Egyptian-Arabic-tone persona defined in AI.md §2 when in Arabic mode.

### AI_RECOMMENDATION_AUTO_APPLY_BLOCKED

- **Category:** AI / Security
- **HTTP:** N/A (this is a defensive assertion failure in tests, not a runtime user-facing code — it should structurally never occur)
- **Message:** "An AI-originated command attempted to bypass explicit approval."
- **Cause:** Would only occur due to a bug — there is no legitimate code path that produces this (AI.md governing rule, BR-AI-001).
- **Recovery:** N/A — this indicates a critical defect; any occurrence blocks release (Testing.md §9 advisory-only enforcement test).
- **User Message:** N/A (should never reach a user).
- **Developer Notes:** Included in this catalog specifically so its absence (zero occurrences) can be asserted in the Stage 5/6/7 release gate (Implementation_Pipeline.md).
- **Logging Level:** `error` (release-blocking if ever observed).
- **Retry Policy:** N/A.
- **Localization:** N/A.

## 9. Hardware Errors (Client-Local, Never Block a Sale)

### PRINTER_UNAVAILABLE

- **Category:** Hardware
- **HTTP:** N/A (client-local)
- **Cause:** Offline, paper out, driver error, disconnected (Hardware.md §2).
- **Recovery:** Automatic fallback to digital receipt (BR-SAL-008); sale is never blocked.
- **User Message:** "Receipt printer unavailable — showing digital receipt instead."
- **Logging Level:** `warn`.
- **Retry Policy:** Retried on next sale automatically; no user action required to "unblock."
- **Localization:** Required.

### SCANNER_MISREAD

- **Category:** Hardware
- **Cause:** Disconnected scanner, or a misread/unreadable barcode.
- **Recovery:** Manual barcode/SKU entry field is always present (Hardware.md §3, BR-HW-003).
- **User Message:** "Couldn't read that barcode. Enter it manually or try scanning again."
- **Logging Level:** `info`.
- **Retry Policy:** User-initiated rescan.
- **Localization:** Required.

### DRAWER_OPEN_FAILED

- **Category:** Hardware
- **Cause:** Jammed or disconnected drawer (Hardware.md §4).
- **Recovery:** Manual-open prompt shown; the underlying sale is already recorded and unaffected (BR-SAL-011).
- **User Message:** "Please open the cash drawer manually."
- **Logging Level:** `warn`.
- **Retry Policy:** N/A.
- **Localization:** Required.

### SCALE_UNSTABLE_OR_DISCONNECTED

- **Category:** Hardware
- **Cause:** Weight reading not yet stable, or scale disconnected (Hardware.md §5).
- **Recovery:** Manual weight entry field always available (BR-HW-004).
- **User Message:** "Scale reading unavailable — enter weight manually."
- **Logging Level:** `info`.
- **Retry Policy:** Automatic re-read attempt while waiting for stability.
- **Localization:** Required.

## 10. Backup & Restore Errors

### BACKUP_INTEGRITY_CHECK_FAILED

- **Category:** Backup
- **HTTP:** N/A (client-local) / 422 if surfaced via a restore API
- **Cause:** Checksum mismatch on a backup file (Security.md §8, BR-BAK-003).
- **Recovery:** Restore is blocked from this specific backup; user selects an earlier verified backup.
- **User Message:** "This backup appears to be corrupted and can't be restored. Try an earlier backup."
- **Developer Notes:** Never silently restores a corrupted state.
- **Logging Level:** `error`.
- **Retry Policy:** N/A — requires selecting a different backup.
- **Localization:** Required.

### RESTORE_REQUIRES_CONFIRMATION

- **Category:** Backup / Workflow
- **HTTP:** N/A (client-local, a UI-flow gate not a failure)
- **Cause:** Restore is a destructive action per UI_UX.md §3.
- **Recovery:** User confirms via the mandatory confirmation dialog before proceeding.
- **User Message:** "Restoring will overwrite current data on this device with the backup's contents. Continue?"
- **Logging Level:** `info`.
- **Retry Policy:** N/A.
- **Localization:** Required.

## 11. Category Summary Table

| Category                 | Codes                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Auth                     | `UNAUTHENTICATED`, `REFRESH_TOKEN_REUSE_DETECTED`, `OFFLINE_AUTH_NO_PRIOR_LOGIN`, `SESSION_TIMEOUT_OFFLINE`           |
| Authorization            | `PERMISSION_DENIED`, `PLATFORM_ADMIN_TOKEN_REJECTED`                                                                  |
| Licensing                | `LICENSE_EXPIRED`, `TRIAL_EXPIRED`, `ACCOUNT_SUSPENDED`, `SUBSCRIPTION_UPGRADE_NOT_OWNER`                             |
| Validation/Business Rule | `VALIDATION_ERROR`, `BUSINESS_RULE_VIOLATION`, `STOCK_INSUFFICIENT`, `DISCOUNT_EXCEEDS_SUBTOTAL`, `APPROVAL_REQUIRED` |
| Resource/Concurrency     | `NOT_FOUND`, `CONFLICT`, `SYNC_CONFLICT_PENDING`                                                                      |
| Rate Limiting/System     | `RATE_LIMITED`, `INTERNAL_ERROR`, `AI_PROVIDER_UNAVAILABLE`                                                           |
| AI                       | `AI_SCHEMA_VALIDATION_FAILED`, `AI_RESPONSE_DEGRADED`, `AI_RECOMMENDATION_AUTO_APPLY_BLOCKED`                         |
| Hardware                 | `PRINTER_UNAVAILABLE`, `SCANNER_MISREAD`, `DRAWER_OPEN_FAILED`, `SCALE_UNSTABLE_OR_DISCONNECTED`                      |
| Backup                   | `BACKUP_INTEGRITY_CHECK_FAILED`, `RESTORE_REQUIRES_CONFIRMATION`                                                      |

This table must stay in sync with API.md §3's canonical HTTP-facing subset; codes here that are client-local-only (marked "N/A" HTTP mapping) are domain/UI conventions layered on top of, never contradicting, API.md §3.

---

_Error_Catalog.md — every code here maps to exactly one plain-language string per active language (Design_System.md Arabic-first/English-secondary rule); a new error code introduced in code without a corresponding row here is a documentation-drift bug per Coding_Standards.md's spirit._
