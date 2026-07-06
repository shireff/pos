# Phase 18 — Security & Advanced Permissions Tests

## Unit Tests

- Custom role cannot include a permission not defined in the system permissions collection
- Custom role cannot grant any Platform Administration capability (platform.* codes)
- Custom role cannot exceed the ceiling of the system role it is derived from
- Role ceiling enforcement: Branch Manager creating a custom role cannot assign Owner-level permissions
- ETA activation requires tax.eta.activate_module permission — non-Owner → 403

## Integration Tests

- POST /v1/roles (custom): creates custom role with subset of allowed permissions
- POST /v1/roles (attempt to add platform.accounts.suspend): 403 PERMISSION_DENIED
- Custom role assigned to user: user can perform permitted actions, blocked on others
- ETA module activated: eta_invoices created for qualifying orders
- ETA module disabled: no eta_invoices created
- Approval workflow threshold configured: action above threshold → 202 APPROVAL_REQUIRED

## Sync Tests

- Custom role created on Desktop → syncs to Android
- Same permission field edited on two devices concurrently → escalates to Owner resolution (never Branch Manager)

## E2E Tests (Enterprise Scenario — exit gate)

- Owner creates custom role with specific inventory permissions → assigns to employee → employee can adjust stock, cannot create products
- Owner activates ETA module → completes a sale → ETA invoice record created with pending status
- Platform Admin (advanced): second admin account created → can view accounts but cannot suspend (support role)
- Approval workflow: configure discount approval threshold → cashier applies discount above threshold → manager approves → discount applied
