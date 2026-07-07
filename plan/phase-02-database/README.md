# Phase 02 — Authentication & Licensing

## Purpose

Full authentication system (online JWT + offline PIN), RBAC permission enforcement at the Application layer, device registration, 14-day trial lifecycle, subscription state machine, Platform Admin minimal surface (MFA-gated, separate auth realm), and the trial/paywall write-lock guard. This phase gates every subsequent feature phase — no business data can be written without auth.

## Scope

All layers delivered together as one working vertical slice:

- **Database**: users, roles, permissions, user_branch_roles, subscriptions, subscription_plans, license_keys, devices, platform_admins, platform_admin_actions collections + validation schemas
- **Domain**: Identity & Access bounded context, Billing & Licensing bounded context, Platform Administration bounded context
- **Business Logic**: login, PIN offline auth, RBAC resolution, subscription lifecycle state machine, trial expiry self-lock, Platform Admin commands
- **API**: `/v1/auth/*`, `/v1/devices/register`, `/v1/subscription/*`, `/v1/platform-admin/auth/*`, `/v1/platform-admin/accounts/*`
- **Validation**: Zod schemas for all auth request bodies
- **Permissions**: all permission codes from Permission_Matrix.md seeded as system data
- **Events**: UserAuthenticated, UserLoginFailed, DeviceRegistered, SubscriptionTrialStarted, SubscriptionActivated, SubscriptionTrialExpired, SubscriptionLocked, PlatformAdminPlanChanged, PlatformAdminAccountSuspended, PlatformAdminAccountReactivated
- **Sync**: auth data syncs as Class B field-merge; subscription status syncs to all devices in real-time
- **Desktop UI**: Login screen (Arabic RTL), offline PIN screen, trial countdown banner, paywall/lockout screen (trial_expired and suspended variants)
- **Android UI**: Same screens, shared components, bottom-sheet PIN entry
- **State Management**: auth store (Redux Toolkit), subscription store
- **Tests**: unit, integration, E2E, security matrix tests

## Expected Output

A fully working auth system where:

- A user can log in online, then log in offline with PIN on both Desktop and Android
- A fresh company gets a 14-day trial with all features unlocked
- Trial expiry self-locks a device locally even when fully offline
- Platform Admin can log in with MFA from a separate URL, change a plan, suspend an account
- A tenant JWT is rejected by any `/v1/platform-admin/*` endpoint

## Documents Referenced

- Security.md (all sections)
- API.md §2, §4.8, §8
- Database.md §2.4–2.5, §2.16–2.16.3
- Permission_Matrix.md (all sections)
- State_Machines.md §6 (Subscription), §7 (User), §8 (Device)
- Event_Catalog.md §2, §10
- Business_Rules.md §9, §12
- Notifications.md §3 (trial/billing triggers)
- UI_UX.md §2.7
- Configuration_System.md §8, §15
