# Phase 02 — Authentication & Licensing TODO

## Database

- [x] Create MongoDB migration `002_auth_schema.ts`: companies, branches, warehouses, users, roles, permissions, role_permissions, user_branch_roles collections with full JSON Schema validators
- [x] Create migration `002b_subscription_schema.ts`: subscriptions, subscription_plans, license_keys, devices collections
- [x] Create migration `002c_platform_admin_schema.ts`: platform_admins, platform_admin_actions collections (append-only enforcement at repository layer)
- [x] Seed system roles (Owner, Company Administrator, Branch Manager, Assistant Manager, Cashier, Inventory Manager, Warehouse Employee, Purchasing Officer, Sales Employee, Accountant, Financial Manager, Auditor, Customer Service, Marketing Employee, Delivery Employee, Technical Support, Read-only User)
- [x] Seed all 90+ permission codes from Permission_Matrix.md into permissions collection
- [x] Seed 3 subscription plans: basic, pro, enterprise with feature_flags_json per PRD §6

- [x] Create MongoDB migration `002_auth_schema.ts`: companies, branches, warehouses, users, roles, permissions, role_permissions, user_branch_roles collections with full JSON Schema validators

- [x] Create migration `002b_subscription_schema.ts`: subscriptions, subscription_plans, license_keys, devices collections

- [x] Create migration `002c_platform_admin_schema.ts`: platform_admins, platform_admin_actions collections (append-only enforcement at repository layer)

- [x] Seed system roles (Owner, Company Administrator, Branch Manager, Assistant Manager, Cashier, Inventory Manager, Warehouse Employee, Purchasing Officer, Sales Employee, Accountant, Financial Manager, Auditor, Customer Service, Marketing Employee, Delivery Employee, Technical Support, Read-only User)

- [x] Seed all 90+ permission codes from Permission_Matrix.md into permissions collection

- [x] Seed 3 subscription plans: basic, pro, enterprise with feature_flags_json per PRD §6

## Domain — Identity & Access

- [x] Implement `User` aggregate: id (UUIDv7), companyId, name, phone, email, passwordHash, isActive, defaultBranchId
- [x] Implement `Role` entity: id, companyId (nullable for system roles), name, isSystemRole
- [x] Implement `Permission` value object: id, module, action, code
- [x] Implement `UserBranchRole` entity: userId, branchId, roleId
- [x] Implement `Company` aggregate: id, name, businessType, defaultCurrency, defaultLanguage, timezone, etaEnabled
- [x] Implement `Branch` aggregate: id, companyId, name, address, workingHoursOverride, isActive
- [x] Implement `Device` entity: id, companyId, deviceType, deviceFingerprint, registeredAt, lastSeenAt

## Domain — Billing & Licensing

- [x] Implement `Subscription` aggregate with status enum: trialing/active/past_due/locked/canceled/suspended
- [x] Implement `SubscriptionPlan` entity with feature_flags_json resolution
- [x] Implement `LicenseKey` entity with grace_period_ends_at
- [x] Implement entitlement resolution logic (5-step precedence: override → trialing → active → past_due grace → locked) — Database.md §2.16.1
- [x] Implement `SubscriptionWriteLockGuard`: cross-cutting Application layer guard that rejects state-changing commands when status is trial_expired or suspended

## Domain — Platform Administration

- [x] Implement `PlatformAdminUser` aggregate (separate from users table)
- [x] Implement `PlatformAdminAction` entity (append-only, cross-tenant)
- [x] Implement `TenantOverride` value object

## Application — Auth Use Cases

- [x] `LoginCommand` + handler: validate credentials, generate JWT (15min) + refresh token (hashed, stored), write UserAuthenticated audit entry
- [x] `RefreshTokenCommand` + handler: rotate refresh token on every use, reject replayed tokens
- [x] `LogoutCommand` + handler: revoke refresh token, write audit entry
- [x] `OfflinePinLoginCommand` + handler: validate PIN against locally-cached hash, enforce session timeout
- [x] `RegisterDeviceCommand` + handler: bind deviceFingerprint to company license, fire DeviceRegistered event
- [x] `RevokeDeviceCommand` + handler: revoke device refresh tokens, write audit entry

## Application — Subscription Use Cases

- [x] `StartTrialCommand` + handler: create subscription with status=trialing, trialEndsAt = now + 14 days
- [x] `UpgradeSubscriptionCommand` + handler: Owner-only, transition to active, lift write-lock
- [x] `ExpireTrialJob`: nightly job — query subscriptions where status=trialing AND trialEndsAt < now → set status=trial_expired, emit SubscriptionTrialExpired
- [x] `SelfLockCommand` (client-side): device reads cached trialEndsAt, locks locally when expired offline

## Application — Platform Admin Use Cases

- [x] `PlatformAdminLoginCommand` + handler: credentials → MFA challenge token (never a full session until MFA verified)
- [x] `PlatformAdminMfaVerifyCommand` + handler: TOTP verify → return adminAccessToken (separate signing key, aud: "platform-admin")
- [x] `ChangeTenantPlanCommand` + handler: mandatory reason, write platform_admin_actions record
- [x] `SuspendTenantCommand` + handler: mandatory reason, set status=suspended, write record
- [x] `ReactivateTenantCommand` + handler: mandatory reason, restore prior state, write record
- [x] `ExtendTrialCommand` + handler: update trialEndsAt, write record

## API Endpoints

- [x] `POST /v1/auth/login` — body: companyCode, username, password, deviceFingerprint → accessToken, refreshToken, user, permissions[]
- [x] `POST /v1/auth/refresh` — body: refreshToken → new accessToken
- [x] `POST /v1/auth/logout` — invalidate refresh token
- [x] `POST /v1/devices/register` — bind device to license
- [x] `GET /v1/subscription` — current tier, status, trial info
- [x] `POST /v1/subscription/upgrade` — Owner-only tier selection
- [x] `POST /v1/platform-admin/auth/login` — returns mfaChallengeToken only
- [x] `POST /v1/platform-admin/auth/mfa/verify` — returns adminAccessToken
- [x] `POST /v1/platform-admin/auth/logout`
- [x] `GET /v1/platform-admin/accounts` — paginated list with filter support
- [x] `GET /v1/platform-admin/accounts/:companyId` — full account detail
- [x] `PATCH /v1/platform-admin/accounts/:companyId/plan`
- [x] `POST /v1/platform-admin/accounts/:companyId/suspend`
- [x] `POST /v1/platform-admin/accounts/:companyId/reactivate`
- [x] `POST /v1/platform-admin/accounts/:companyId/trial/extend`
- [x] `GET /v1/platform-admin/audit`

## Validation (Zod)

- [x] `LoginSchema`: companyCode string, username string, password string min 8, deviceFingerprint string
- [x] `RefreshTokenSchema`: refreshToken string
- [x] `UpgradeSubscriptionSchema`: planId enum(basic/pro/enterprise), billingCycle enum
- [x] `PlatformAdminLoginSchema`: email, password
- [x] `MfaVerifySchema`: mfaChallengeToken, code string 6-digit
- [x] `ChangePlanSchema`: planId, reason string non-empty
- [x] `SuspendSchema`: reason string non-empty
- [x] `ExtendTrialSchema`: newTrialEndsAt ISO date, reason string non-empty

## Permissions & RBAC Middleware

- [x] Implement `resolvePermissions(userId, branchId)`: reads user_branch_roles → role_permissions → returns effective permission set for that branch
- [x] Implement `requirePermission(code)` middleware: checks effective permissions, returns 403 with specific `permissionCode` if missing
- [x] Implement Owner cross-branch short-circuit: Owner role skips per-branch lookup
- [x] Implement `requirePlatformAdmin` middleware: validates adminAccessToken aud claim = "platform-admin", rejects tenant tokens
- [x] Write permission matrix test: for every system role × every permission code, assert correct 200/403 behavior

## Sync

- [x] subscription status change syncs to all devices via sync stream (API.md §5.4 subscription.status_changed event)
- [x] Offline device reads cached trialEndsAt from last sync and self-locks locally at that timestamp

## Desktop UI

- [x] Login screen: company code + username + password fields, Arabic RTL, English toggle
- [x] Offline PIN screen: 6-digit PIN pad, "Last synced: X" timestamp shown
- [x] Trial countdown banner: appears at day 10, non-dismissible at day 11+, shows days/hours remaining
- [x] Paywall screen (trial_expired): "Your 14-day trial has ended" + plan comparison + "Choose a Plan" CTA
- [x] Paywall screen (suspended): "Your account has been suspended" + support contact link (no plan picker)
- [x] Read-only mode indicator: persistent banner when locked account views historical data
- [x] Platform Admin login screen (separate app entry point): visually distinct, "Internal Tool" watermark

## Android UI

- [x] Same Login, PIN, Trial, Paywall screens — shared components from `packages/ui-components`
- [x] Bottom-sheet PIN entry on Android (touch-friendly)
- [x] All screens function offline

## State Management

- [x] `useAuthStore` (Redux Toolkit): currentUser, accessToken (in-memory only, never on disk), branchRoles[], isAuthenticated, isOffline
- [x] `useSubscriptionStore` (Redux Toolkit): status, trialEndsAt, planId, isReadOnlyLocked, isFullAccessOverride

## Tests

- [x] See TESTS.md

## Documentation

- [x] Inline doc comments on all exported domain classes
- [x] `packages/domain/identity/README.md`
- [x] `packages/domain/billing/README.md`
- [x] `packages/domain/platform-admin/README.md`
- [x] Update API.md if any endpoint contract was refined
