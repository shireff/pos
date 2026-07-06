# UI_UX.md — Smart Retail OS UI/UX Specification

**Depends on:** PRD.md, Design System.md
**Scope note:** This document defines the complete screen inventory, navigation model, and flow/validation patterns for v1. Field-by-field validation tables for every screen live alongside each screen's implementation ticket in Development Roadmap.md to keep this document navigable; the patterns and rules defined here apply uniformly to all of them.

## 1. Navigation Model

- **Desktop:** persistent left sidebar (RTL-aware: right sidebar in Arabic mode) grouped by module (POS, Inventory, Purchasing, Customers, Reports, AI Insights, Settings). Top bar shows branch switcher (for multi-branch users), sync status indicator, notification bell, and — only while `subscriptions.status` is `trialing` with ≤4 days remaining, or `trial_expired`/`suspended` — a persistent trial-countdown / lockout indicator (§2.7) that cannot be dismissed.
- **Android:** bottom tab bar for the 5 most-used destinations (POS, Inventory, Orders, Insights, More), with a hamburger/"More" drawer for the remainder — cashier-role accounts see a simplified tab set (POS, Orders, More) since they don't need admin destinations.
- **Role-aware navigation:** menu items are filtered entirely based on the logged-in user's effective permissions for the active branch — a Cashier never even sees an "Inventory Adjustments" menu entry, rather than seeing it disabled.
- **Platform Admin console** (§2.7) is a completely separate web app with its own navigation shell (accounts list, account detail, admin audit log) — it never appears in, links from, or shares navigation chrome with the tenant-facing Desktop/Android apps (Architecture.md §3.1).

## 2. Screen Inventory (by module)

### 2.1 POS / Sales

- **POS Register (main cashier screen):** product grid/search + cart panel + payment panel. Barcode scan input always focused by default. Cart supports swipe-to-remove (Android) / click-to-remove (Desktop). If the account is `trial_expired` or `suspended` (§2.7), "Complete Sale" is disabled with an inline explanation and a link to the Paywall screen — every other read-only aspect of the screen (browsing the catalog, viewing the cart total) remains usable so the cashier isn't left with a broken-looking screen.

### 2.2 Inventory

- **Product List:** filterable/sortable table (Desktop) / card list (Android) with stock-level color coding (red = below reorder point, amber = approaching, green = healthy).
- **Product Detail/Edit:** tabs for General Info, Variants, Units & Conversion, Batches/Expiry, Pricing History, Stock by Warehouse.
- **Stock Adjustment Dialog:** quantity delta input, mandatory reason, approval-workflow banner if configured.
- **Stock Transfer Wizard:** multi-step (Select items → Select destination → Review → Submit), with status tracking screen for in-flight transfers.

### 2.3 Purchasing

- **Purchase Order Builder:** supplier selection, line-item entry (with barcode scan support), approval-request submission.
- **OCR Invoice Import:** camera/upload capture → parsed-fields review form (all fields editable before commit) → confirm & create supplier invoice.

### 2.4 Customers

- **Customer List/Search:** phone-number-first search (matches PRD identification pattern).
- **Customer Profile:** purchase history, loyalty balance, credit ledger, communication log.
- **Loyalty Redemption Dialog:** points balance, redemption options, confirmation.

### 2.5 Reports & AI Insights

- **Report Viewer:** shared shell across all report types — filter bar, chart/table toggle, export buttons (PDF/CSV), schedule-delivery button. Remains fully usable even when locked (§2.7), since reports are read-only.
- **Store Health Dashboard:** composite score gauge, sub-score cards (Sales/Inventory/Financial/Employee/Customer Health), AI narrative panel, top-3-recommendations list with Accept/Dismiss actions feeding `ai_insight_feedback`.
- **AI Assistant Chat Panel:** persistent chat surface (available as a slide-over on Desktop, full screen on Android), shows `source: local/cloud` badge per response.

### 2.6 Settings & Administration

- **Company/Branch Settings, Roles & Permissions Builder** (drag/toggle matrix of module × action), **Users Management**, **Subscription & Billing** (current plan, trial countdown, upgrade button, invoice history), **Device Management**, **Backup & Restore**, **Sync Status & Conflict Review**, **Audit Log Viewer**, **Notification Preferences** (§Notifications.md §5, includes the non-mutable Billing & Trial category).

### 2.7 Trial, Paywall & Platform Administration

**Tenant-facing (Desktop + Android):**

- **Trial Countdown Banner:** appears in the top bar (§1) starting at day 10 of the 14-day trial, showing days/hours remaining; tapping it opens **Subscription & Billing** (§2.6) directly to the plan picker. Non-dismissible in its final 4 days (Notifications.md §4), but never blocks any screen behind it.
- **Paywall / Lockout Screen:** shown as a full-screen, non-bypassable modal the moment `subscriptions.status` is `trial_expired` or `suspended` (API.md §4.8, §8.4), on app launch and on any attempted write action (§2.1). Content differs by cause:
  - `trial_expired`: "Your 14-day trial has ended" + plan comparison + **Choose a Plan** primary action → `POST /v1/subscription/upgrade` (API.md §4.8) → on success the modal dismisses immediately and normal navigation (§1) returns.
  - `suspended`: "Your account has been suspended" + a support-contact action (never a plan picker, since suspension isn't resolved by paying) per API.md §8.4's requirement that the client distinguish the two causes.
  - In both cases, a secondary **"View my data (read-only)"** action dismisses the modal into a visibly read-only mode (banner persists per §1) rather than trapping the owner with no way to see their own reports — consistent with API.md §4.8's read-only guarantee.
- **Destructive-action pattern** (§3) still applies to `POST /v1/subscription/upgrade` when it involves a downgrade that would lose data/features — a confirmation dialog states the consequence in plain language before submitting.

**Platform Admin console (vendor-internal web app, separate from the above):**

- **Login + MFA Challenge:** two-step screen matching `POST /v1/platform-admin/auth/login` + `.../mfa/verify` (API.md §8.1) — deliberately visually distinct (different branding, a persistent "Internal Tool" watermark) from the tenant login screen so an admin never confuses which system they're in.
- **Accounts List:** searchable/filterable table (company name, owner email, plan, status, trial end date, MRR) backed by `GET /v1/platform-admin/accounts` (API.md §8.2) — status shown as a colored badge reusing Design_System.md status-pill component (§Design_System.md §6) but in a visually distinct admin theme, never the tenant theme.
- **Account Detail:** subscription history timeline, device list, last-sync-per-device, and three primary actions surfaced as buttons, each opening a confirmation dialog requiring a mandatory reason field (mirroring UI_UX.md §3's destructive-action pattern, since every one of these is high-consequence): **Change Plan**, **Suspend Account**, **Extend/Adjust Trial**. A **Reactivate** button replaces Suspend once an account is suspended.
- **Admin Audit Log:** read-only table over `GET /v1/platform-admin/audit` (API.md §8.5), filterable by account/admin/date — the Platform Admin equivalent of the tenant Audit Log Viewer (§2.6), but never showing tenant-internal audit_entries content, only vendor-side actions taken against accounts.

## 3. Cross-Cutting Flow Patterns

- **Create/Edit pattern:** every entity editor uses the same shell (header with Save/Cancel, body form, inline validation), so AI-agent implementers reuse one form-shell component rather than rebuilding per-entity.
- **Approval-pending pattern:** any action requiring approval (per PRD workflows) shows an immediate "Submitted — pending approval" state to the requester and generates a Notification + queue item for the approver; the requester's screen never blocks waiting for approval.
- **Offline indicator pattern:** any screen showing data that may be stale due to pending sync displays a subtle "as of last sync" timestamp rather than pretending data is always live.
- **Destructive action pattern:** delete/void/cancel actions always require a confirmation dialog stating the consequence in plain language (not just "Are you sure?") and, where audit-relevant, a mandatory reason field. Every Platform Admin account/plan-mutating action (§2.7) follows this pattern with a mandatory reason field, no exceptions.
- **Locked-account pattern (new):** any write-triggering control (buttons, form submits) checks `subscriptions.status` before dispatching; when locked, the control is disabled (not hidden) with an inline "Trial ended — upgrade to continue" / "Account suspended — contact support" microcopy rather than only surfacing the block after a failed API call, so the Paywall screen (§2.7) is the fallback for full-screen contexts, and inline disabling is the fallback for in-flow controls.

## 4. Validation Rules (general pattern, applied per-field in each screen's spec)

- Required-field validation is inline and immediate (on blur), never only on submit.
- Numeric fields (price, quantity, discount %) reject negative values by default except where a domain rule explicitly allows negative (e.g., adjustment deltas).
- Barcode fields validate format (checksum where applicable, e.g., EAN-13) and warn on duplicate before save.
- Cross-field validation (e.g., discount amount ≤ line subtotal) is enforced at both UI and domain-command level — UI validation is a UX convenience, never the sole enforcement point (domain layer is authoritative, per Architecture.md).
- The mandatory `reason` field on every Platform Admin action (§2.7) is validated identically to any other mandatory audit-relevant reason field in the tenant app (§3) — non-empty, minimum length, no client-side bypass (server re-validates).

## 5. Error & Empty States

- Every list screen defines an explicit empty state with a clear next action (e.g., empty Product List → "Add your first product" CTA), not just a blank table.
- Network/sync errors never show raw technical error text to end users — messages are mapped from API error codes (API.md §3) to plain-language, role-appropriate copy in the active language. `TRIAL_EXPIRED` and `ACCOUNT_SUSPENDED` (API.md §3) map specifically to the Paywall/Lockout Screen (§2.7), never a generic error toast.

## 6. Accessibility & Responsive Behavior

- All interactive elements meet minimum touch-target size (44×44px) on Android.
- Color is never the sole signal for state (stock-level colors in §2.2 are paired with icons/text labels) to remain usable for color-blind users. The trial-countdown banner and account-status badges (§2.7) follow the same rule — always paired with text ("3 days left", "Suspended"), never color alone.
- Desktop layouts are responsive down to a minimum supported window size (defined in Design System.md); Android layouts support both phone and tablet form factors, with tablet unlocking a two-pane layout (list + detail side-by-side) where screen width allows. The Platform Admin console (§2.7) is Desktop-only for v1 (it is an internal tool, not a customer-facing surface with a mobile requirement).

---

_UI_UX.md — pairs with Design System.md for the full visual language; individual screen tickets in Development Roadmap.md expand field-level detail as each is built._
