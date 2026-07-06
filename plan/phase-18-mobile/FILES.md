# Phase 18 — Security & Advanced Permissions Files

## Domain Extensions

```
packages/domain/identity/src/aggregates/custom-role.aggregate.ts
packages/domain/identity/src/domain-events/custom-role-created.event.ts
packages/domain/identity/src/domain-events/custom-role-updated.event.ts
packages/domain/tax/src/domain-events/eta-module-activated.event.ts
```

## Application Use Cases

```
packages/application/identity/src/create-custom-role/create-custom-role.command.ts
packages/application/identity/src/create-custom-role/create-custom-role.handler.ts
packages/application/identity/src/create-custom-role/create-custom-role.handler.test.ts
packages/application/identity/src/update-custom-role/update-custom-role.command.ts
packages/application/identity/src/update-custom-role/update-custom-role.handler.ts
packages/application/tax/src/activate-eta/activate-eta-module.command.ts
packages/application/tax/src/activate-eta/activate-eta-module.handler.ts
```

## UI Components

```
packages/ui-components/src/permissions/RolePermissionMatrix.tsx
packages/ui-components/src/permissions/RolePermissionMatrix.test.tsx
packages/ui-components/src/permissions/CustomRoleBuilder.tsx
packages/ui-components/src/permissions/CustomRoleBuilder.test.tsx
packages/ui-components/src/permissions/PermissionToggle.tsx
packages/ui-components/src/settings/ApprovalWorkflowConfig.tsx
packages/ui-components/src/settings/ETAModuleToggle.tsx
```

## Desktop & Android Features

```
apps/desktop/src/features/settings/RolesPermissionsPage.tsx
apps/desktop/src/features/settings/ApprovalWorkflowPage.tsx
apps/android/src/features/settings/RolesPermissionsPage.tsx
```

## Platform Admin — Advanced Console Extensions

```
apps/platform-admin/src/features/admin-users/AdminUsersPage.tsx
apps/platform-admin/src/features/admin-users/CreateAdminUserForm.tsx
apps/platform-admin/src/features/analytics/PlatformAnalyticsPage.tsx
apps/platform-admin/src/http/admin-users/admin-users.controller.ts
```
