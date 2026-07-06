# Phase 18 — Security & Advanced Permissions

## Purpose

Custom role/permission builder (tenant-facing drag/toggle matrix), ETA e-invoice module activation, multi-company owner cross-visibility, full Platform Admin console depth, approval workflow configuration UI, and security audit checklist verification. Delivers the final security hardening layer and enterprise-tier customization features.

## Scope

- **Custom Role Builder**: Owner-accessible UI for creating custom roles with a drag/toggle permission matrix; custom roles cannot be granted permissions above their system role ceiling (ceiling is the highest system role the Owner assigns as the ceiling at creation time)
- **Role Ceiling Enforcement**: domain rule prevents any custom role permission set from including permissions not in its assigned ceiling system role
- **ETA Module Activation**: company-level toggle (Owner-only) that enables ETA e-invoice submission; toggle stored in company configuration; all ETA data model fields already present from Phase 11
- **ETA Invoice Submission Tracking**: submission status, receipt number, rejection reasons stored per invoice
- **Multi-Company Owner View**: Owner account linked to multiple company records can switch between companies in a single session; each company has isolated data but the owner sees a cross-company summary
- **Platform Admin Console Depth**: multi-admin account management (add/remove/deactivate admin accounts), deeper account analytics (usage metrics per tenant), bulk operations (suspend multiple accounts, extend trial in batch), audit log viewer
- **Approval Workflow Configuration**: UI for configuring threshold values per action type (discount approval threshold, return approval threshold, stock adjustment approval threshold, price change approval threshold) — stored in company_settings
- **Security Audit Checklist**: internal checklist verification run — all items from Security.md verified by automated test suite
- **Permissions**: security.roles.manage (Owner only), security.permissions.view, platform_admin.accounts.manage, platform_admin.analytics.view, platform_admin.bulk_operations

## Expected Output

A working security customization layer where:

- Custom roles can be created and their permissions cannot exceed the assigned ceiling
- ETA module activation toggle enables invoice submission for the company
- Multi-company owner can switch between companies
- Platform Admin console supports multi-admin management and bulk operations
- Approval thresholds are configurable per action type via UI
- Security audit checklist passes all items

## Documents Referenced

- Security.md (all sections)
- Permission_Matrix.md
- API.md §8
- Business_Rules.md §9

## Included Modules

- `packages/domain/identity/src/aggregates/custom-role.aggregate.ts`
- `packages/domain/identity/src/domain-services/role-ceiling-enforcer.ts`
- `packages/application/identity/src/custom-roles/*`
- `packages/infrastructure/mongodb/migrations/018_custom_roles_schema.ts`
- `apps/backend/src/http/roles/*`
- `apps/platform-admin/src/http/analytics/*`
- `apps/platform-admin/src/http/bulk-operations/*`
- `packages/ui-components/src/security/RolePermissionMatrix.tsx`
- `packages/ui-components/src/security/ApprovalThresholdSettings.tsx`
- `packages/ui-components/src/security/EtaModuleToggle.tsx`
- `apps/desktop/src/features/settings/security/*`
