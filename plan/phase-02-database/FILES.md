# Phase 02 — Authentication & Licensing Files

## Database Migrations

```
packages/infrastructure/mongodb/migrations/002_auth_schema.ts
packages/infrastructure/mongodb/migrations/002b_subscription_schema.ts
packages/infrastructure/mongodb/migrations/002c_platform_admin_schema.ts
packages/infrastructure/mongodb/seeds/system-roles.seed.ts
packages/infrastructure/mongodb/seeds/permissions.seed.ts
packages/infrastructure/mongodb/seeds/subscription-plans.seed.ts
packages/infrastructure/mongodb/schemas/users.schema.json
packages/infrastructure/mongodb/schemas/roles.schema.json
packages/infrastructure/mongodb/schemas/permissions.schema.json
packages/infrastructure/mongodb/schemas/subscriptions.schema.json
packages/infrastructure/mongodb/schemas/platform_admins.schema.json
packages/infrastructure/mongodb/schemas/platform_admin_actions.schema.json
```

## Domain — Identity

```
packages/domain/identity/src/entities/user.entity.ts
packages/domain/identity/src/entities/role.entity.ts
packages/domain/identity/src/entities/device.entity.ts
packages/domain/identity/src/value-objects/permission.vo.ts
packages/domain/identity/src/value-objects/user-branch-role.vo.ts
packages/domain/identity/src/aggregates/company.aggregate.ts
packages/domain/identity/src/aggregates/branch.aggregate.ts
packages/domain/identity/src/domain-events/user-authenticated.event.ts
packages/domain/identity/src/domain-events/user-login-failed.event.ts
packages/domain/identity/src/domain-events/device-registered.event.ts
packages/domain/identity/src/domain-events/device-revoked.event.ts
packages/domain/identity/src/domain-events/permission-role-changed.event.ts
packages/domain/identity/README.md
```

## Domain — Billing

```
packages/domain/billing/src/aggregates/subscription.aggregate.ts
packages/domain/billing/src/entities/subscription-plan.entity.ts
packages/domain/billing/src/entities/license-key.entity.ts
packages/domain/billing/src/domain-services/entitlement-resolver.ts
packages/domain/billing/src/domain-services/subscription-write-lock-guard.ts
packages/domain/billing/src/domain-events/subscription-trial-started.event.ts
packages/domain/billing/src/domain-events/subscription-activated.event.ts
packages/domain/billing/src/domain-events/subscription-trial-expired.event.ts
packages/domain/billing/src/domain-events/subscription-locked.event.ts
packages/domain/billing/README.md
```

## Domain — Platform Admin

```
packages/domain/platform-admin/src/aggregates/platform-admin-user.aggregate.ts
packages/domain/platform-admin/src/entities/platform-admin-action.entity.ts
packages/domain/platform-admin/src/value-objects/tenant-override.vo.ts
packages/domain/platform-admin/src/domain-events/platform-admin-plan-changed.event.ts
packages/domain/platform-admin/src/domain-events/platform-admin-account-suspended.event.ts
packages/domain/platform-admin/src/domain-events/platform-admin-account-reactivated.event.ts
packages/domain/platform-admin/src/domain-events/platform-admin-trial-extended.event.ts
packages/domain/platform-admin/README.md
```

## Application — Auth Use Cases

```
packages/application/identity/src/login/login.command.ts
packages/application/identity/src/login/login.handler.ts
packages/application/identity/src/login/login.handler.test.ts
packages/application/identity/src/refresh-token/refresh-token.command.ts
packages/application/identity/src/refresh-token/refresh-token.handler.ts
packages/application/identity/src/logout/logout.command.ts
packages/application/identity/src/logout/logout.handler.ts
packages/application/identity/src/offline-pin-login/offline-pin-login.command.ts
packages/application/identity/src/offline-pin-login/offline-pin-login.handler.ts
packages/application/identity/src/offline-pin-login/offline-pin-login.handler.test.ts
packages/application/identity/src/register-device/register-device.command.ts
packages/application/identity/src/register-device/register-device.handler.ts
packages/application/identity/src/resolve-permissions/resolve-permissions.query.ts
packages/application/identity/src/resolve-permissions/resolve-permissions.handler.ts
```

## Application — Billing Use Cases

```
packages/application/billing/src/start-trial/start-trial.command.ts
packages/application/billing/src/start-trial/start-trial.handler.ts
packages/application/billing/src/upgrade-subscription/upgrade-subscription.command.ts
packages/application/billing/src/upgrade-subscription/upgrade-subscription.handler.ts
packages/application/billing/src/expire-trial/expire-trial.job.ts
packages/application/billing/src/get-subscription/get-subscription.query.ts
packages/application/billing/src/get-subscription/get-subscription.handler.ts
```

## Application — Platform Admin Use Cases

```
packages/application/platform-admin/src/login/platform-admin-login.command.ts
packages/application/platform-admin/src/login/platform-admin-login.handler.ts
packages/application/platform-admin/src/mfa-verify/platform-admin-mfa-verify.command.ts
packages/application/platform-admin/src/mfa-verify/platform-admin-mfa-verify.handler.ts
packages/application/platform-admin/src/change-plan/change-tenant-plan.command.ts
packages/application/platform-admin/src/change-plan/change-tenant-plan.handler.ts
packages/application/platform-admin/src/suspend/suspend-tenant.command.ts
packages/application/platform-admin/src/suspend/suspend-tenant.handler.ts
packages/application/platform-admin/src/reactivate/reactivate-tenant.command.ts
packages/application/platform-admin/src/reactivate/reactivate-tenant.handler.ts
packages/application/platform-admin/src/extend-trial/extend-trial.command.ts
packages/application/platform-admin/src/extend-trial/extend-trial.handler.ts
packages/application/platform-admin/src/list-accounts/list-accounts.query.ts
packages/application/platform-admin/src/list-accounts/list-accounts.handler.ts
```

## Infrastructure — Repositories

```
packages/infrastructure/mongodb/repositories/user.repository.ts
packages/infrastructure/mongodb/repositories/role.repository.ts
packages/infrastructure/mongodb/repositories/subscription.repository.ts
packages/infrastructure/mongodb/repositories/platform-admin.repository.ts
packages/infrastructure/mongodb/repositories/platform-admin-action.repository.ts
packages/infrastructure/mongodb/repositories/device.repository.ts
```

## API (Backend)

```
apps/backend/src/http/auth/auth.controller.ts
apps/backend/src/http/auth/auth.controller.test.ts
apps/backend/src/http/auth/auth.schemas.ts
apps/backend/src/http/subscription/subscription.controller.ts
apps/backend/src/http/subscription/subscription.schemas.ts
apps/backend/src/middleware/require-permission.ts
apps/backend/src/middleware/require-platform-admin.ts
apps/backend/src/middleware/subscription-write-lock.ts
apps/platform-admin/src/http/auth/platform-admin-auth.controller.ts
apps/platform-admin/src/http/accounts/accounts.controller.ts
apps/platform-admin/src/http/accounts/accounts.schemas.ts
```

## UI — Shared Components

```
packages/ui-components/src/auth/LoginForm.tsx
packages/ui-components/src/auth/LoginForm.test.tsx
packages/ui-components/src/auth/PinPad.tsx
packages/ui-components/src/auth/PinPad.test.tsx
packages/ui-components/src/billing/TrialCountdownBanner.tsx
packages/ui-components/src/billing/PaywallScreen.tsx
packages/ui-components/src/billing/PaywallScreen.test.tsx
packages/ui-components/src/billing/ReadOnlyBanner.tsx
```

## UI — Desktop Features

```
apps/desktop/src/features/auth/LoginPage.tsx
apps/desktop/src/features/auth/OfflinePinPage.tsx
apps/desktop/src/features/billing/SubscriptionPage.tsx
```

## UI — Android Features (shared via packages)

```
apps/android/src/features/auth/LoginPage.tsx
apps/android/src/features/auth/OfflinePinPage.tsx
```

## State Management

```
packages/ui-components/src/stores/auth.store.ts
packages/ui-components/src/stores/subscription.store.ts
```
