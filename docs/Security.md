# Security.md — Smart Retail OS Security Architecture

**Depends on:** Architecture.md, Database.md, API.md §2, §8
**Feeds into:** Implementation_Pipeline.md (Stage 0 auth, Stage 4 Device Trust, Stage 5 trial/paywall + minimal Platform Admin, Stage 9 security audit), Notifications.md §3 (license/device/trial/admin triggers)
**Governing rule:** Every layer's security guarantee must hold even when the device is fully offline for extended periods — security cannot depend on constant connectivity, per Vision.md §5 offline-first philosophy. The one deliberate, explicitly-scoped exception to this rule is trial expiration (§6.2) — a business-model lock, not a connectivity artifact.

## 1. Threat Model Summary

Primary risks this document defends against, in priority order (matching the founder's own stated risk ranking — data safety above all, per Vision.md §5):

1. **Local data theft or tampering** — a stolen/compromised Desktop or Android device exposing a full local copy of company data (Architecture.md §7 means every device holds a complete local DB).
2. **Unauthorized in-app actions** — a cashier or lower-privilege user performing an action outside their role (price changes, refunds, stock adjustments).
3. **Sync-channel interception or forgery** — data altered or spoofed in transit between device and server, or between peer devices (LAN sync, per Sync Architecture.md).
4. **License/subscription/trial circumvention** — bypassing paid-tier gating or extending the free trial without authorization (§6.2).
5. **AI-provider data exposure** — customer/business data leaking to third-party cloud AI providers beyond what's necessary (AI.md §2 already constrains this at the architecture level; this document defines the enforcement mechanism).
6. **Insider misuse** — a legitimate but malicious employee (addressed primarily via RBAC + Audit Log, §4–5, not purely technical prevention).
7. **Platform Admin compromise or misuse** — because a compromised or rogue Platform Admin account can view or alter _any_ tenant's plan/status, this surface is treated as its own top-tier risk with a dedicated, stricter control set (§11), not merely "RBAC with a higher permission level."

## 2. Authentication

### 2.1 Online authentication

- `POST /v1/auth/login` (API.md §2.1): credentials + `deviceFingerprint`, returns short-lived access JWT (15 min) + long-lived refresh token.
- Passwords stored via a slow adaptive hash (bcrypt/argon2 — argon2id preferred, free/open-source per Vision.md §5) with per-user salt; never reversible, never logged.
- Refresh tokens stored **hashed** server-side and **rotated on every use** — a stolen refresh token that gets used is immediately invalidated for the legitimate device too, which surfaces as a forced re-login and is itself a signal worth an Audit Log entry.
- This entire section describes **tenant** authentication only. Platform Admin authentication is an entirely separate realm — see §11.

### 2.2 Offline authentication

- Once a user has authenticated online at least once on a given device, a **local PIN or password check** against a locally-stored hash allows offline login (Implementation_Pipeline.md Step 0.4) — the JWT itself is not required to be valid offline; the local Identity & Access domain module validates against the last-synced user record and permission set.
- Offline sessions still expire (configurable local session timeout) and re-prompt for PIN, even without connectivity, so a device left unlocked doesn't permanently bypass authentication.
- The local credential store is encrypted at rest (§3.1) — an attacker with filesystem access to a locked device cannot read credential hashes directly off disk.

### 2.3 Session & token handling

- Access tokens carry `companyId`, `userId`, `branchRoles[]` and are never persisted to disk in plaintext on the client — held in memory / secure storage APIs (Android Keystore, Tauri's OS credential store) only.
- Logout invalidates the refresh token server-side and writes an `audit_entries` record (§5) even in a solo-device offline scenario, queued for sync like any other event.

## 3. Encryption

### 3.1 At rest

- **Local MongoDB:** all collections encrypted at rest via **MongoDB encrypted storage engine (field-level encryption via libmongocrypt + OS keystore)** — libmongocrypt integrates with the OS keystore (Android Keystore on Android, OS credential store via Tauri on Desktop) to derive and protect the encryption key. All collection data is encrypted at rest; there is no unencrypted fallback for a local device database.
- **Server PostgreSQL:** disk-level encryption via the hosting provider's standard offering (free-tier-compatible options documented per Vision.md §5 free-first philosophy) plus column-level encryption for the highest-sensitivity fields (password hashes are already one-way hashed, not "encrypted"; `license_keys.key_hash` similarly hashed, not reversible).
- **Backups:** encrypted independently of the live DB encryption key (§8) — a backup file is only ever useful if restored through the app, which re-derives access via the company's credentials, not by reading the backup directly.

### 3.2 In transit

- All API and WebSocket traffic is TLS-only (no plaintext fallback) — enforced at the reverse proxy/load balancer layer (Architecture.md §9).
- LAN peer-to-peer sync (Sync Architecture.md, transport layer) uses the same TLS requirement between peer devices, not just device-to-cloud, since the "local network is inherently trusted" assumption is explicitly rejected — a compromised device on the same Wi-Fi should not be able to passively read sync traffic.

## 4. Permissions & Role-Based Access Control (RBAC)

- Implements the model defined in Database.md §2.5: `roles` → `role_permissions` → `permissions`, with `user_branch_roles` allowing a **different role per branch** for the same user (e.g., Manager at Branch A, Cashier at Branch B).
- Permission codes are structured `module.action` (e.g., `inventory.adjust`, `sales.refund.approve`, `reports.view.financial`) — granular enough that the custom Role Builder (UI_UX.md §2.6, Implementation_Pipeline.md Stage 8 Step 31) can compose arbitrary roles without new code.
- **Enforcement is at the Application layer (use case/command handlers), never only at the UI** — per Architecture.md's dependency rule and UI_UX.md §4's explicit statement that UI validation is a convenience, not the authority. Every command handler checks the caller's effective permission for the target branch before executing, regardless of what the UI already filtered.
- 403 responses always include the specific missing `permissionCode` (API.md §2.2) — deliberately not generic, so the client can explain precisely what's blocked without the client itself needing to duplicate permission logic.
- **System roles** (`roles.is_system_role = true`) — Owner, Branch Manager, Cashier, Accountant, Purchasing Officer — ship as non-deletable defaults; custom roles (Stage 8) are additive, never able to grant a permission the system doesn't define.
- **No tenant-facing permission code, however powerful (including Owner's full permission set), can ever grant a Platform Administration capability** (§11) — the two systems are disjoint by construction, not merely by convention (Architecture.md §3.1).

## 5. Audit Log

- `audit_entries` (Database.md §2.17) is **append-only and immutable** — enforced via a database trigger forbidding UPDATE/DELETE (Database.md §7), identical immutability treatment to `stock_movement_events`.
- Every state-changing command writes an audit entry capturing `before_json`/`after_json`, the acting user, device, and timestamp — including actions performed offline, which sync to the server's audit trail like any other event.
- Audited action categories (non-exhaustive, extended as new commands are added): authentication events (login/logout/failed attempts), permission/role changes, price changes, stock adjustments, refunds/returns, discount rule changes, device registration/removal, subscription/license/trial changes, sync conflict resolutions.
- The **Audit Log Viewer** (UI_UX.md §2.6) is itself permission-gated (`audit.view`) — typically Owner-only — since the log can reveal sensitive operational detail.
- Audit entries are never used as the sole enforcement mechanism (they're a record, not a gate) — RBAC (§4) is the gate; the audit log is what lets an owner reconstruct "what happened" after the fact.
- `audit_entries` never contains Platform Admin actions (§11) — a tenant, including the Owner, has no visibility into vendor-side interventions on their account beyond the plain-language status they're already shown (API.md §8.4).

## 6. License & Device Trust

### 6.1 Device registration

- `POST /v1/devices/register` (API.md §4.8) binds a device fingerprint to a company's license. Every subsequent request from that device includes `X-Device-Id` (API.md §2.3).
- New device registration fires an Owner-facing notification (Notifications.md §3) so an owner is aware if an unrecognized device joins their company — a lightweight tripwire against credential leakage, since RBAC alone doesn't prevent a legitimate-but-stolen login from registering a new device.
- Device removal (Settings → Device Management, UI_UX.md §2.6) immediately revokes that device's refresh tokens server-side; the removed device continues to function fully offline with its last-synced data (Architecture.md §7 guarantee) but can no longer push/pull sync until re-registered under valid credentials — this is a deliberate trade-off: revocation blocks _sync_, not _local business continuity_, consistent with the offline-first philosophy.

### 6.2 Trial period and license validation

- **Every new company gets a 14-calendar-day free trial with every plan tier's features unlocked** (API.md §4.8) — there is deliberately no feature-limited "lite trial"; the product experience during the trial must be identical to a paid Enterprise account, since the founder's conversion strategy depends on a genuinely full-featured first impression.
- **Ordinary license/subscription staleness** (§2.3, a device that hasn't been able to re-validate its license against the server recently) is never a hard block solely due to that staleness within the configured grace period — a shop must never lose the ability to sell because the internet was down when the license check would have run. `license_keys.grace_period_ends_at` defines this boundary; once exceeded without a successful re-validation, tier-gated features degrade per `LICENSE_EXPIRED` (API.md §3), while core offline POS/inventory functions are the last thing ever gated, per Vision.md's "offline-first, always" principle.
- **Trial expiration is a distinct, intentionally stricter case, not a variant of the above.** Once `trialEndsAt` (API.md §4.8) passes with no active paid plan, the account transitions to `trial_expired` and becomes **fully write-locked** (`403 TRIAL_EXPIRED` on every state-changing endpoint, including offline-queued sync pushes) — the offline-first "never block a sale" guarantee is explicitly and deliberately overridden for this one case, because a trial-expired account is by definition not a paying customer with a business-continuity guarantee to protect. The lock is enforced both server-side (rejecting sync pushes, §API.md §5.1) and client-side (each device caches the `trialEndsAt` value from its last sync and self-locks locally at that timestamp even fully offline), so disconnecting a device cannot be used to keep operating past the trial window.
- **Read-only access is always preserved** during a trial-expired or suspended lock (§11) — an owner can always view historical reports, export data, and see the Paywall/upgrade screen (UI_UX.md §2.7); only _new_ writes are blocked.
- License keys are stored hashed (`key_hash`), never in reversible form, matching the password-hash treatment in §2.1.

## 7. Data Privacy & AI Data Handling

- Reinforces AI.md §2: no raw database dumps are ever sent to a third-party cloud AI provider (Groq, Gemini) — only pre-aggregated, minimal read-model slices relevant to the specific query.
- Customer PII (phone, name) is included in AI context only when the query genuinely requires identifying a customer (e.g., "what does customer X usually buy") and is never included in prompts used for caching/comparison across unrelated queries (AI.md §9) to avoid PII persisting in a shared cache key.
- Local-model queries (AI.md §1 routing policy step 1) never leave the device at all — the strongest privacy guarantee available is preferred by default whenever the query classification allows it.

## 8. Backup Encryption & Integrity

- Incremental backups (Implementation_Pipeline.md Stage 5, Step 22) are encrypted with a key derived independently from the live database encryption key (§3.1) — so a compromised backup file alone (e.g., stolen from cloud storage) does not also expose the live DB key, and vice versa.
- Every backup includes an integrity checksum verified on restore; a failed integrity check blocks restore and surfaces a plain-language error (per UI_UX.md §5) rather than silently restoring a corrupted state.
- Restore is a permission-gated, confirmation-required destructive action (UI_UX.md §3 destructive-action pattern) since it can overwrite current local state. Restore remains available even during a trial-expired/suspended lock (§6.2, §11) — it is a data-safety operation, not a business write, and is explicitly excluded from the write-lock.

## 9. Secure Development Practices

- No secrets (API keys, DB credentials, signing keys) are ever committed to the repository — environment-variable/secret-manager injection only, enforced by CI lint rule (Coding Standards.md).
- Dependency vulnerabilities are checked as part of CI (Implementation_Pipeline.md Step 0.1's lint/CI setup) given the project's reliance on open-source packages (Vision.md §5).
- The AI Gateway (AI.md §1) and every external HTTP client are the _only_ places outbound network calls to third parties originate from — narrowing the surface area that needs security review when auditing what data could leave the system.

## 10. Incident Response Posture

- Given this is a small-team/solo-founder-plus-AI-agent build (Vision.md §3), incident response for v1 is intentionally lightweight but explicit rather than absent: any suspected credential compromise is handled by (1) revoking the affected device(s) (§6.1), (2) forcing a password reset for the affected user, (3) reviewing the Audit Log (§5) for the affected time window, (4) notifying the owner directly.
- A suspected Platform Admin credential compromise follows a stricter runbook (§11.5) given the blast radius (every tenant, not one).
- A formal breach-notification and incident-response runbook is a Stage 9 hardening deliverable (Implementation_Pipeline.md Stage 9, Step 36 security audit checklist) rather than a v1-launch blocker, consistent with the project's staged-rigor approach.

## 11. Platform Administration Security

**Governing principle:** the Platform Admin surface (Architecture.md §3.1, API.md §8) is the single highest-blast-radius part of the entire system — a compromised Platform Admin credential can view or alter _every_ tenant's plan and status. It is therefore deliberately over-engineered relative to ordinary tenant RBAC (§4), not treated as "just another role."

### 11.1 Separate authentication realm

- Platform Admin accounts (`platform_admins`, Database.md) are **not** rows in the tenant `users` table and are never associated with a `companyId` — they are vendor staff (initially just the founder), modeled entirely outside the tenant data model.
- Platform Admin login (`POST /v1/platform-admin/auth/login`, API.md §8.1) is served from a separate host (`admin-api.<domain>`), issues a structurally distinct JWT (different signing key, `aud: "platform-admin"` claim) from tenant tokens, and is never accepted by any `/v1/*` tenant endpoint — enforced by the token verification middleware checking `aud` before anything else, so a misconfigured route can't accidentally accept the wrong token type.

### 11.2 Mandatory multi-factor authentication

- **MFA (TOTP-based) is mandatory for every Platform Admin account with no opt-out, no "trusted device" bypass, and no grace period** — this is the one place in the system where the offline-first "don't block on strict checks" philosophy does not apply, since Platform Admin actions require connectivity by definition (they mutate server-side tenant state).
- MFA enrollment happens at account creation time; a Platform Admin account cannot be activated without a verified TOTP secret.

### 11.3 Account lockout

- Five consecutive failed login or MFA verification attempts locks the account for 15 minutes (API.md §8.1) with no self-service unlock — unlocking requires another Platform Admin (or, for a single-founder setup, a documented manual server-side procedure) — and immediately notifies every other active Platform Admin account (Notifications.md §3) so a brute-force attempt is never silent.
- Unlike tenant offline sessions (§2.2), there is no offline mode for Platform Admin — every session requires a live, freshly-validated token; there is nothing to make "offline-capable" here since the surface only exists to mutate server-side state.

### 11.4 Full, separate audit trail

- Every Platform Admin action (plan change, trial extension/override, suspend, reactivate, login/logout, even failed login attempts) writes to `platform_admin_actions` (Database.md) — a table that is append-only/immutable at the database trigger level, identical in mechanism to `audit_entries` (§5) but **entirely separate storage, entirely separate access path**, so no tenant-facing code path, permission, or query can ever read it (Architecture.md §3.1).
- Every entry records the acting admin, the target `companyId`, the action, the mandatory `reason` text (API.md §8.3), a before/after snapshot of the affected subscription fields, and a timestamp.
- `GET /v1/platform-admin/audit` (API.md §8.5) is the only read path, itself Platform-Admin-authenticated.

### 11.5 Compromise response runbook

If a Platform Admin credential is suspected compromised: (1) immediately revoke that admin's refresh tokens and force a password + TOTP re-enrollment, (2) review `platform_admin_actions` for the affected time window across **all** tenants (not just one), (3) for any tenant whose plan/status was altered during the suspected window, proactively notify that tenant's Owner and offer to reverse the change, (4) rotate the Platform Admin JWT signing key, invalidating every other active Platform Admin session as a precaution.

---

_Security.md — Stage 0 (auth), Stage 4 (Device Trust), Stage 5 (trial/paywall enforcement + minimal Platform Admin, per Implementation_Pipeline.md), and Stage 9 (audit) all gate against this document; a step that cannot meet its Definition of Done without violating a rule here must stop and flag it (Implementation_Pipeline.md §6)._
