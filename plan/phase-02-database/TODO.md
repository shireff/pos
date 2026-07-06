# Phase 02 — Authentication & Licensing TODO

## Database

- [ ] Create MongoDB migration `002_auth_schema.ts`: companies, branches, warehouses, users, roles, permissions, role_permissions, user_branch_roles collections with full JSON Schema validators
- [ ] Create migration `002b_subscription_schema.ts`: subscriptions, subscription_plans, license_keys, devices collections
- [ ] Create migration `002c_platform_admin_schema.ts`: platform_admins, platform_admin_actions collections (append-only enforcement at repository layer)
- [ ] Seed system roles (Owner, Company Administrator, Branch Manager, Assistant Manager, Cashier, Inventory Manager, Warehouse Employee, Purchasing Officer, Sales Employee, Accountant, Financial Manager, Auditor, Customer Service, Marketing Employee, Delivery Employee, Technical Support, Read-only User)
- [ ] Seed all 90+ permission codes from Permission_Matrix.md into permissions collection
- [ ] Seed 3 subscription plans: basic, pro, enterprise with feature_flags_json per PRD §6

## Domain — Identity & Access

- [ ] Implement `User` aggregate: id (UUIDv7), companyId, name, phone, email, passwordHash, isActive, defaultBranchId
- [ ] Implement `Role` entity: id, companyId (nullable for system roles), name, isSystemRole
- [ ] Implement `Permission` value object: id, module, action, code
- [ ] Implement `UserBranchRole` entity: userId, branchId, roleId
- [ ] Implement `Company` aggregate: id, name, businessType, defaultCurrency, defaultLanguage, timezone, etaEnabled
- [ ] Implement `Branch` aggregate: id, companyId, name, address, workingHoursOverride, isActive
- [ ] Implement `Device` entity: id, companyId, deviceType, deviceFingerprint, registeredAt, lastSeenAt

## Domain — Billing & Licensing

- [ ] Implement `Subscription` aggregate with status enum: trialing/active/past_due/locked/canceled/suspended
- [ ] Implement `SubscriptionPlan` entity with feature_flags_json resolution
- [ ] Implement `LicenseKey` entity with grace_period_ends_at
- [ ] Implement entitlement resolution logic (5-step precedence: override → trialing → active → past_due grace → locked) — Database.md §2.16.1
- [ ] Implement `SubscriptionWriteLockGuard`: cross-cutting Application layer guard that rejects state-changing commands when status is trial_expired or suspended

## Domain — Platform Administration

- [ ] Implement `PlatformAdminUser` aggregate (separate from users table)
- [ ] Implement `PlatformAdminAction` entity (append-only, cross-tenant)
- [ ] Implement `TenantOverride` value object

## Application — Auth Use Cases

- [ ] `LoginCommand` + handler: validate credentials, generate JWT (15min) + refresh token (hashed, stored), write UserAuthenticated audit entry
- [ ] `RefreshTokenCommand` + handler: rotate refresh token on every use, reject replayed tokens
- [ ] `LogoutCommand` + handler: revoke refresh token, write audit entry
- [ ] `OfflinePinLoginCommand` + handler: validate PIN against locally-cached hash, enforce session timeout
- [ ] `RegisterDeviceCommand` + handler: bind deviceFingerprint to company license, fire DeviceRegistered event
- [ ] `RevokeDeviceCommand` + handler: revoke device refresh tokens, write audit entry

## Application — Subscription Use Cases

- [ ] `StartTrialCommand` + handler: create subscription with status=trialing, trialEndsAt = now + 14 days
- [ ] `UpgradeSubscriptionCommand` + handler: Owner-only, transition to active, lift write-lock
- [ ] `ExpireTrialJob`: nightly job — query subscriptions where status=trialing AND trialEndsAt < now → set status=trial_expired, emit SubscriptionTrialExpired
- [ ] `SelfLockCommand` (client-side): device reads cached trialEndsAt, locks locally when expired offline

## Application — Platform Admin Use Cases

- [ ] `PlatformAdminLoginCommand` + handler: credentials → MFA challenge token (never a full session until MFA verified)
- [ ] `PlatformAdminMfaVerifyCommand` + handler: TOTP verify → return adminAccessToken (separate signing key, aud: "platform-admin")
- [ ] `ChangeTenantPlanCommand` + handler: mandatory reason, write platform_admin_actions record
- [ ] `SuspendTenantCommand` + handler: mandatory reason, set status=suspended, write record
- [ ] `ReactivateTenantCommand` + handler: mandatory reason, restore prior state, write record
- [ ] `ExtendTrialCommand` + handler: update trialEndsAt, write record

## API Endpoints

- [ ] `POST /v1/auth/login` — body: companyCode, username, password, deviceFingerprint → accessToken, refreshToken, user, permissions[]
- [ ] `POST /v1/auth/refresh` — body: refreshToken → new accessToken
- [ ] `POST /v1/auth/logout` — invalidate refresh token
- [ ] `POST /v1/devices/register` — bind device to license
- [ ] `GET /v1/subscription` — current tier, status, trial info
- [ ] `POST /v1/subscription/upgrade` — Owner-only tier selection
- [ ] `POST /v1/platform-admin/auth/login` — returns mfaChallengeToken only
- [ ] `POST /v1/platform-admin/auth/mfa/verify` — returns adminAccessToken
- [ ] `POST /v1/platform-admin/auth/logout`
- [ ] `GET /v1/platform-admin/accounts` — paginated list with filter support
- [ ] `GET /v1/platform-admin/accounts/:companyId` — full account detail
- [ ] `PATCH /v1/platform-admin/accounts/:companyId/plan`
- [ ] `POST /v1/platform-admin/accounts/:companyId/suspend`
- [ ] `POST /v1/platform-admin/accounts/:companyId/reactivate`
- [ ] `POST /v1/platform-admin/accounts/:companyId/trial/extend`
- [ ] `GET /v1/platform-admin/audit`

## Validation (Zod)

- [ ] `LoginSchema`: companyCode string, username string, password string min 8, deviceFingerprint string
- [ ] `RefreshTokenSchema`: refreshToken string
- [ ] `UpgradeSubscriptionSchema`: planId enum(basic/pro/enterprise), billingCycle enum
- [ ] `PlatformAdminLoginSchema`: email, password
- [ ] `MfaVerifySchema`: mfaChallengeToken, code string 6-digit
- [ ] `ChangePlanSchema`: planId, reason string non-empty
- [ ] `SuspendSchema`: reason string non-empty
- [ ] `ExtendTrialSchema`: newTrialEndsAt ISO date, reason string non-empty

## Permissions & RBAC Middleware

- [ ] Implement `resolvePermissions(userId, branchId)`: reads user_branch_roles → role_permissions → returns effective permission set for that branch
- [ ] Implement `requirePermission(code)` middleware: checks effective permissions, returns 403 with specific `permissionCode` if missing
- [ ] Implement Owner cross-branch short-circuit: Owner role skips per-branch lookup
- [ ] Implement `requirePlatformAdmin` middleware: validates adminAccessToken aud claim = "platform-admin", rejects tenant tokens
- [ ] Write permission matrix test: for every system role × every permission code, assert correct 200/403 behavior

## Sync

- [ ] subscription status change syncs to all devices via sync stream (API.md §5.4 subscription.status_changed event)
- [ ] Offline device reads cached trialEndsAt from last sync and self-locks locally at that timestamp

## Desktop UI

- [ ] Login screen: company code + username + password fields, Arabic RTL, English toggle
- [ ] Offline PIN screen: 6-digit PIN pad, "Last synced: X" timestamp shown
- [ ] Trial countdown banner: appears at day 10, non-dismissible at day 11+, shows days/hours remaining
- [ ] Paywall screen (trial_expired): "Your 14-day trial has ended" + plan comparison + "Choose a Plan" CTA
- [ ] Paywall screen (suspended): "Your account has been suspended" + support contact link (no plan picker)
- [ ] Read-only mode indicator: persistent banner when locked account views historical data
- [ ] Platform Admin login screen (separate app entry point): visually distinct, "Internal Tool" watermark

## Android UI

- [ ] Same Login, PIN, Trial, Paywall screens — shared components from `packages/ui-components`
- [ ] Bottom-sheet PIN entry on Android (touch-friendly)
- [ ] All screens function offline

## State Management

- [ ] `useAuthStore` (Zustand): currentUser, accessToken (in-memory only, never on disk), branchRoles[], isAuthenticated, isOffline
- [ ] `useSubscriptionStore` (Zustand): status, trialEndsAt, planId, isReadOnlyLocked, isFullAccessOverride

## Tests

- [ ] See TESTS.md

## Documentation

- [ ] Inline doc comments on all exported domain classes
- [ ] `packages/domain/identity/README.md`
- [ ] `packages/domain/billing/README.md`
- [ ] `packages/domain/platform-admin/README.md`
- [ ] Update API.md if any endpoint contract was refined
