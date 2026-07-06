# Phase 18 — Security & Advanced Permissions Checklist

A phase is **NOT complete** until every item below is checked.

## Custom Role Builder

- [ ] CustomRole aggregate implemented with ceilingSystemRoleId
- [ ] RoleCeilingEnforcer rejects any permission not in ceiling system role — verified by test
- [ ] Custom role permissions cannot exceed ceiling on both create and update
- [ ] RolePermissionMatrix UI renders grid with ceiling boundaries visible
- [ ] Delete custom role works; users assigned to deleted role reassigned to default

## ETA Module

- [ ] ActivateEtaModuleCommand requires ETA registration number in company profile
- [ ] etaEnabled toggles correctly in company settings
- [ ] ETA invoice submission tracking fields present in order documents
- [ ] ETA module toggle UI works for Owner only — non-Owner sees disabled state

## Multi-Company Owner

- [ ] Owner with multiple companies can switch company context without re-logging in
- [ ] Switching company reloads permissions for new company
- [ ] Company switcher UI renders in top navigation on Desktop and Android

## Platform Admin Console Depth

- [ ] Multi-admin management endpoints working
- [ ] Deeper tenant analytics endpoint returns usage metrics
- [ ] Bulk suspend/extend-trial operations work correctly
- [ ] Audit log viewer shows admin actions with filters

## Approval Thresholds

- [ ] ApprovalThresholdSettings UI allows Owner to configure all 4 threshold types
- [ ] Threshold changes take effect for new requests immediately
- [ ] All downstream approval workflows read from company_settings thresholds

## Security Audit

- [ ] Automated security audit test suite passes all items
- [ ] Any manual items from Security.md are documented with pass/fail status

## Sync

- [ ] custom_roles: Class B sync working
- [ ] company_settings: Class B sync working

## Tests

- [ ] RoleCeilingEnforcer test: permission above ceiling rejected
- [ ] ETA activation test: requires registration number
- [ ] Multi-company switch test: permissions refresh correctly

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
