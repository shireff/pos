# Phase 18 — Security & Advanced Permissions TODO

## Custom Role Builder

- [ ] Implement `CustomRole` aggregate (`packages/domain/identity/src/aggregates/custom-role.aggregate.ts`): id, companyId, name, ceilingSystemRoleId, permissions[] (subset of ceiling role permissions), createdByOwnerId
- [ ] Implement `RoleCeilingEnforcer` domain service: given a custom role's permission set and its ceiling system role, verify every requested permission exists in the ceiling role's permission set; reject with RoleCeilingViolationError if any permission exceeds ceiling
- [ ] Implement custom role CRUD use cases: CreateCustomRoleCommand, UpdateCustomRoleCommand, DeleteCustomRoleCommand, CloneCustomRoleCommand
- [ ] Enforce ceiling at Application layer: every custom role permission update passes through RoleCeilingEnforcer before persisting

## Custom Role Builder UI

- [ ] `RolePermissionMatrix.tsx` (`packages/ui-components/src/security/RolePermissionMatrix.tsx`): grid of permissions organized by module; toggle each on/off; disabled if not in ceiling role; shows ceiling boundary visually
- [ ] Desktop settings page: Custom Roles list → select role → show matrix; create/delete role
- [ ] Android: same page in single-column scrollable layout

## ETA Module Activation

- [ ] Add `etaEnabled` field to Company aggregate (already present, now activated from UI)
- [ ] `ActivateEtaModuleCommand` + handler: Owner-only; sets company.etaEnabled = true; validates ETA registration number is present
- [ ] `DeactivateEtaModuleCommand` + handler: Owner-only; sets company.etaEnabled = false
- [ ] `EtaModuleToggle.tsx` (`packages/ui-components/src/security/EtaModuleToggle.tsx`): settings toggle with registration number input; shows ETA submission status
- [ ] ETA invoice submission tracking: submit_status enum(pending/submitted/accepted/rejected) per order invoice; display in order detail

## Multi-Company Owner

- [ ] Add companyIds[] array to Owner user profile (multiple company associations)
- [ ] `SwitchCompanyCommand` + handler: changes active company context in auth session; re-fetches permissions for new company
- [ ] Company switcher UI in top navigation (Desktop and Android): dropdown showing all associated companies with current selection

## Platform Admin Console Depth

- [ ] Multi-admin management: POST /v1/platform-admin/admins (add admin), DELETE /v1/platform-admin/admins/:id, PATCH /v1/platform-admin/admins/:id/deactivate
- [ ] Deeper analytics: GET /v1/platform-admin/analytics — per-tenant: active device count, daily active users, feature usage, storage used
- [ ] Bulk operations: POST /v1/platform-admin/bulk/suspend — body: companyIds[], reason; POST /v1/platform-admin/bulk/extend-trial
- [ ] Audit log viewer: GET /v1/platform-admin/audit with filters: adminId, actionType, companyId, dateRange

## Approval Workflow Configuration

- [ ] `ApprovalThresholdSettings.tsx` (`packages/ui-components/src/security/ApprovalThresholdSettings.tsx`): inputs for each threshold type (discount approval amount, return approval amount, stock adjustment approval quantity, price change approval percent)
- [ ] Store thresholds in company_settings document
- [ ] `UpdateApprovalThresholdsCommand` + handler: Owner-only; validate all thresholds are positive numbers; persist to company_settings

## Security Audit Checklist Verification

- [ ] Run automated security audit test suite (`apps/backend/src/security-audit/security-audit.test.ts`): verifies JWT signing key separation, tenant/platform-admin realm isolation, append-only enforcement on audit/ledger collections, field-level encryption active, backup encryption independence
- [ ] Document manual items from Security.md that cannot be automated (note which require manual verification)

## Database

- [ ] Create migration `018_custom_roles_schema.ts`: custom_roles collection with permissions[] array, ceilingSystemRoleId, companyId
- [ ] Add approval thresholds to company_settings structure

## API Endpoints

- [ ] `GET /v1/roles` — list all roles (system + custom) for company
- [ ] `POST /v1/roles` — create custom role
- [ ] `PATCH /v1/roles/:id` — update custom role
- [ ] `DELETE /v1/roles/:id` — delete custom role
- [ ] `POST /v1/settings/eta/activate` — Owner only
- [ ] `POST /v1/settings/eta/deactivate` — Owner only
- [ ] `PATCH /v1/settings/approval-thresholds` — Owner only
- [ ] `POST /v1/auth/switch-company` — switch active company context

## Permissions

- [ ] Enforce `security.roles.manage` (Owner only) on all role CRUD endpoints
- [ ] Enforce `security.permissions.view` on GET /v1/roles
- [ ] ETA activation requires `company.settings.manage` (Owner only)

## Sync

- [ ] custom_roles: Class B field-level HLC merge
- [ ] company_settings (approval thresholds, etaEnabled): Class B

## Tests

- [ ] See TESTS.md

### Quality Gates

- [ ] Zero TypeScript errors
- [ ] All tests passing
- [ ] Update API.md if any endpoint contract was refined during implementation