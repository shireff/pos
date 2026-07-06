# Permission_Matrix.md — Smart Retail OS Complete Permission Matrix

**Depends on:** Security.md §4, Database.md §2.5, PRD.md §4.2, API.md §2.2
**Feeds into:** UI_UX.md §2.6 (Roles & Permissions Builder), Implementation_Pipeline.md Stage 8 Step 33 (custom role builder), Coding_Standards.md §4 (naming: `module.action`)
**Governing rule:** This document is the canonical, exhaustive list of every `permissionCode` in the system. A permission used in code that does not appear here, or a row here with no corresponding enforcement in an Application-layer command handler, is a documentation-drift bug per Implementation_Pipeline.md §4. Enforcement is always at the Application layer (Security.md §4) — this matrix describes _what is granted to which system role by default_, never the sole enforcement mechanism.

## 1. Permission Code Format

Every code follows `module.action` (Coding_Standards.md §4). Where an action has a sensitivity tier, it is expressed as a distinct code (e.g., `reports.view.financial` vs. `reports.view.sales`) rather than a generic `reports.view` with hidden scoping — so the Custom Role Builder (UI_UX.md §2.6) can compose exactly the intended surface.

Legend used in tables below:

- **✔** = granted by default to this system role
- **—** = not granted by default
- **✔\*** = granted by default only when a specific config/approval-threshold condition is met (see notes)
- **Owner-only** = escalates to Owner regardless of any other role's normal ceiling (matches Sync_Architecture.md §5 same-field-role-conflict escalation and Security.md §4 system-role rules)

System roles (PRD FR-2.1, Security.md §4): **Owner (OW)**, **Company Administrator (CA)**, **Branch Manager (BM)**, **Assistant Manager (AM)**, **Cashier (CS)**, **Inventory Manager (IM)**, **Warehouse Employee (WE)**, **Purchasing Officer (PO)**, **Sales Employee (SE)**, **Accountant (AC)**, **Financial Manager (FM)**, **Auditor (AU)**, **Customer Service (CX)**, **Marketing Employee (MK)**, **Delivery Employee (DE)**, **Technical Support (TS)**, **Read-only User (RO)**.

All roles except Owner are **branch-scoped** by default (a user's permission grant applies to the branch(es) they hold that role in, per `user_branch_roles`, Database.md §2.5); Owner is the only role with implicit cross-branch, cross-module visibility (PRD FR-2.4). Custom roles (Security.md §4, UI_UX.md §2.6) may compose any subset of the permissions below — they can never exceed what a system role could theoretically hold, and can never grant a Platform Administration capability (Architecture.md §3.1, Security.md §11) under any circumstance.

## 2. Identity, Companies & Branches

| Permission Code    | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| ------------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `company.view`     | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | ✔   | ✔   | ✔   | —   | —   | —   | ✔   | ✔   |
| `company.edit`     | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `branch.view`      | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   |
| `branch.create`    | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `branch.edit`      | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `branch.archive`   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `warehouse.view`   | ✔   | ✔   | ✔   | ✔   | —   | ✔   | ✔   | ✔   | —   | —   | ✔   | ✔   | —   | —   | ✔   | —   | ✔   |
| `warehouse.create` | ✔   | ✔   | ✔   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `warehouse.edit`   | ✔   | ✔   | ✔   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |

_`branch.edit`\* for Branch Manager is limited to branch-local settings that a company-level default permits overriding (Notifications.md §3, Architecture.md §7-adjacent settings model)._

## 3. Users, Roles & Permissions

| Permission Code               | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| ----------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `users.view`                  | ✔   | ✔   | ✔\* | ✔\* | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | ✔   |
| `users.create`                | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `users.edit`                  | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `users.deactivate`            | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `roles.view`                  | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | ✔   |
| `roles.create_custom`         | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `roles.edit`                  | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `roles.assign`                | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `permissions.view_matrix`     | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   |
| `shift.configure_hours`       | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `approval_workflow.configure` | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |

_`users.*`\* for Branch Manager is scoped to users whose only roles are within that manager's own branch(es); a Branch Manager can never create/edit/deactivate a user holding an Owner/Company Administrator role, per RBAC role-ceiling rules (Security.md §4). `roles.assign`\* for Branch Manager is limited to assigning already-existing roles at or below their own ceiling within their branch — never creating or assigning a role with broader scope than their own._

## 4. Product Catalog & Inventory

| Permission Code                | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| ------------------------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `catalog.view`                 | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   |
| `catalog.create`               | ✔   | ✔   | ✔   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `catalog.edit`                 | ✔   | ✔   | ✔   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `catalog.delete`               | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `catalog.price.edit`           | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   |
| `catalog.barcode.generate`     | ✔   | ✔   | ✔   | ✔   | —   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `catalog.bundle.configure`     | ✔   | ✔   | ✔   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `catalog.unit_conversion.edit` | ✔   | ✔   | ✔   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `inventory.view`               | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | —   | —   | ✔   | ✔   | —   | —   | —   | —   | ✔   |
| `inventory.adjust`             | ✔   | ✔   | ✔\* | —   | —   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `inventory.adjust.approve`     | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `inventory.batch.manage`       | ✔   | ✔   | ✔   | —   | —   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `inventory.transfer.create`    | ✔   | ✔   | ✔   | ✔   | —   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `inventory.transfer.approve`   | ✔   | ✔   | ✔\* | —   | —   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `inventory.transfer.receive`   | ✔   | ✔   | ✔   | ✔   | —   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |

_`catalog.delete`\* and `catalog.price.edit`\* for Branch Manager, and `inventory.adjust`\* for Branch Manager/Warehouse Employee, and `inventory.transfer.approve`\* for Branch Manager/Inventory Manager, are subject to the configurable approval-workflow thresholds in PRD FR-2.6 — the action is either permitted directly or requires escalation to an approver role, per company configuration (Notifications.md §3 "pending approval" triggers)._

## 5. Point of Sale (Sales)

| Permission Code                   | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| --------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `sales.create`                    | ✔   | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   |
| `sales.view`                      | ✔   | ✔   | ✔   | ✔   | ✔\* | —   | —   | —   | ✔\* | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   |
| `sales.discount.apply`            | ✔   | ✔   | ✔   | ✔   | ✔\* | —   | —   | —   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   |
| `sales.discount.approve`          | ✔   | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `sales.void`                      | ✔   | ✔   | ✔   | ✔\* | ✔\* | —   | —   | —   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   |
| `sales.refund.approve`            | ✔   | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   |
| `sales.return.create`             | ✔   | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   |
| `sales.cash_drawer.open_no_sale`  | ✔   | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `sales.shift.open_close`          | ✔   | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   |
| `sales.shift.reconciliation.view` | ✔   | ✔   | ✔   | ✔   | ✔\* | —   | —   | —   | ✔\* | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   |

_`sales.view`\*/`sales.shift.reconciliation.view`\* for Cashier/Sales Employee is limited to their own transactions/shift (Reports.md §4 Cashier Shift Summary role-scoping rule). `sales.discount.apply`\*, `sales.void`\* for Cashier/Sales Employee are capped at the configured non-approval threshold (PRD FR-2.6); above it, `sales.discount.approve`/escalation to Assistant Manager or above is required._

## 6. Purchasing & Suppliers

| Permission Code                 | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| ------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `purchasing.supplier.view`      | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   | —   | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   |
| `purchasing.supplier.manage`    | ✔   | ✔   | ✔\* | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `purchasing.po.create`          | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `purchasing.po.approve`         | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   |
| `purchasing.po.receive`         | ✔   | ✔   | ✔   | —   | —   | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `purchasing.invoice.record`     | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   | —   | ✔   | ✔   | —   | —   | —   | —   | —   | —   |
| `purchasing.invoice.ocr_import` | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   |

## 7. Customers & Loyalty

| Permission Code               | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| ----------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `customers.view`              | ✔   | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | —   | —   | ✔   |
| `customers.create`            | ✔   | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | ✔   | —   | —   | —   | ✔   | —   | —   | —   | —   |
| `customers.edit`              | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   |
| `customers.credit.manage`     | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | —   | —   | —   | —   | —   | —   |
| `customers.loyalty.redeem`    | ✔   | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | ✔   | —   | —   | —   | ✔   | —   | —   | —   | —   |
| `customers.loyalty.configure` | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | ✔\* | —   | —   | —   |

_`customers.loyalty.configure`\* for Marketing Employee is limited to campaign/bonus-points configuration, not core program structure (points-per-currency ratio, tier thresholds), which remains Owner/Company Administrator only._

## 8. Payments, Discounts, Coupons & Promotions

| Permission Code               | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| ----------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `payments.tender.record`      | ✔   | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   |
| `payments.provider.configure` | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   |
| `promotions.discount.create`  | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   |
| `promotions.coupon.create`    | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   |
| `promotions.campaign.manage`  | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   |
| `promotions.view`             | ✔   | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | ✔   | ✔   | ✔   | ✔   | —   | ✔   | —   | —   | ✔   |

## 9. Taxes & Compliance

| Permission Code           | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| ------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tax.rules.view`          | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   |
| `tax.rules.edit`          | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   |
| `tax.eta.activate_module` | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `tax.eta.submit_invoice`  | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | —   | —   | —   | —   | —   | —   |
| `tax.eta.view_status`     | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   |

## 10. Warehousing & Stock Transfers

_(See §4 Inventory rows above for the transfer lifecycle permissions; this section captures warehouse-configuration-specific codes not already listed.)_

| Permission Code                                | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| ---------------------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `warehouse.central.designate`                  | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `warehouse.reorder_point.edit`                 | ✔   | ✔   | ✔   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `warehouse.reorder_point.accept_ai_suggestion` | ✔   | ✔   | ✔   | —   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |

## 11. Reports & Dashboards

| Permission Code                  | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| -------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `reports.view.sales`             | ✔   | ✔   | ✔   | ✔   | ✔\* | —   | —   | —   | ✔\* | ✔   | ✔   | ✔   | —   | ✔\* | —   | —   | ✔   |
| `reports.view.financial`         | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔\* |
| `reports.view.inventory`         | ✔   | ✔   | ✔   | ✔   | —   | ✔   | ✔   | ✔   | —   | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   |
| `reports.view.employees`         | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   |
| `reports.view.customers`         | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | ✔   | —   | —   | ✔   |
| `reports.view.purchasing`        | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   | —   | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   |
| `reports.branch_comparison.view` | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | —   | —   | —   | —   | —   |
| `reports.export`                 | ✔   | ✔   | ✔   | ✔   | —   | ✔\* | —   | ✔\* | —   | ✔   | ✔   | ✔   | —   | ✔\* | —   | —   | ✔   |
| `reports.schedule_delivery`      | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | —   | —   | —   | —   | —   | —   |

_`reports.view.sales`\* for Cashier/Sales Employee is self-scoped (own transactions); for Marketing Employee it is limited to aggregate/anonymized sales trend data, never per-transaction detail. `reports.view.financial`\* for Auditor/Read-only is view-only per their role definition (never edit, never export beyond what's explicitly enabled). `reports.export`\* for Inventory Manager/Purchasing Officer/Marketing is limited to their own module's reports._

## 12. Notifications

| Permission Code                         | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| --------------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `notifications.preferences.edit_own`    | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   |
| `notifications.preferences.edit_others` | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `notifications.billing_trial.view`      | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |

_Only the Owner role receives Billing & Trial category notifications by default (Notifications.md §5); `notifications.billing_trial.view` cannot be reassigned via `notifications.preferences.edit_others` to any other role, since Notifications.md §5 fixes this as an Owner-exclusive default that only the Owner's own preference screen can waive for themselves — no other role can grant it to itself or others._

## 13. AI Services

| Permission Code                   | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| --------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ai.assistant.use`                | ✔   | ✔   | ✔   | ✔   | —   | ✔\* | —   | ✔\* | —   | ✔   | ✔   | ✔   | —   | ✔\* | —   | —   | —   |
| `ai.predictions.view`             | ✔   | ✔   | ✔   | —   | —   | ✔   | —   | ✔\* | —   | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   |
| `ai.recommendation.accept_reject` | ✔   | ✔   | ✔\* | —   | —   | ✔\* | —   | ✔\* | —   | ✔\* | ✔   | —   | —   | —   | —   | —   | —   |
| `ai.fraud_alerts.view`            | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | —   | —   | —   | —   | —   |
| `ai.health_score.view`            | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | —   | —   | —   | —   | ✔   |
| `ai.ocr.use`                      | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   | —   | ✔   | —   | —   | —   | —   | —   | —   | —   |
| `ai.insight_feedback.submit`      | ✔   | ✔   | ✔   | —   | —   | ✔   | —   | ✔   | —   | ✔   | ✔   | —   | —   | —   | —   | —   | —   |

_`ai.recommendation.accept_reject`\* is scoped per-domain: Branch Manager/Inventory Manager may accept/reject inventory-domain recommendations (reorder points, dead-product actions) only; Purchasing Officer for supplier suggestions only; Accountant for financial-domain recommendations only; pricing recommendations (AI.md §6 dynamic pricing) require `catalog.price.edit` in addition, per the "architecturally identical to a manual price edit" rule. All AI features remain available identically during the 14-day trial regardless of role's normal tier gating (PRD FR-16.4, Security.md §6.2) — role-based permission still applies; only the *plan-tier* gate is suspended during trial._

## 14. Synchronization

| Permission Code                             | OW         | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| ------------------------------------------- | ---------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `sync.status.view`                          | ✔          | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | ✔   | ✔   |
| `sync.conflicts.view`                       | ✔          | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | ✔   | —   |
| `sync.conflicts.resolve`                    | ✔          | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `sync.conflicts.resolve.security_sensitive` | Owner-only | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `sync.device.register`                      | ✔          | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `sync.device.revoke`                        | ✔          | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |

_`sync.conflicts.resolve`\* excludes any conflict on a role/permission field, which always escalates to Owner regardless of who could otherwise resolve conflicts at that branch (Sync_Architecture.md §5). `sync.device.register`\* for Branch Manager applies only to devices at their own branch._

## 15. Security

| Permission Code                   | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| --------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `audit.view`                      | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   |
| `security.session.manage_own`     | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   | ✔   |
| `security.session.revoke_others`  | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | ✔\* | —   |
| `security.encryption_status.view` | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | ✔   | —   |

_`audit.view` is Owner-only by default per Security.md §5 ("typically Owner-only"); Company Administrator\* may be granted it explicitly since CA is the closest delegate role, but it is not on by default. Auditor's `audit.view` is inherent to the role's definition (full visibility, zero edit rights, PRD §3). `security.session.revoke_others`\* for Branch Manager is limited to sessions at their branch; for Technical Support\* it is a support capability, not an administrative one, and is itself audit-logged (Security.md §5)._

## 16. Administration (Company Settings)

| Permission Code               | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| ----------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `settings.company.edit`       | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `settings.branch.edit`        | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `settings.hardware.configure` | ✔   | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   |
| `settings.localization.edit`  | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `devices.view`                | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | ✔   | —   |
| `devices.manage`              | ✔   | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | ✔\* | —   |

_`settings.branch.edit`\* for Branch Manager is limited to fields the company-level configuration allows a branch to override (Notifications.md §1's inheritance model). `devices.manage`\* for Technical Support is a support capability (re-pairing, troubleshooting), never license/plan-affecting._

## 17. Backups & Restore

| Permission Code             | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| --------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `backup.trigger_manual`     | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | ✔\* | —   |
| `backup.configure_schedule` | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `backup.restore`            | ✔   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `backup.view_history`       | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | —   | —   | —   | ✔   | —   |

_Per Security.md §8/UI_UX.md §3, `backup.restore` is a destructive, confirmation-gated action; Company Administrator\* holds it only if explicitly granted, since a restore can overwrite current local state company-wide. `backup.trigger_manual`\* for Technical Support is a support capability. All backup/restore permissions remain exercisable during a `trial_expired`/`suspended` lock (Security.md §8, §6.2 data-safety carve-out) — the write-lock guard (Architecture.md §7) explicitly excludes backup/restore from the blocked-command set._

## 18. Licensing & Subscription (Tenant-Facing)

| Permission Code                     | OW  | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| ----------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `subscription.view`                 | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | ✔   | —   | —   | —   | —   | ✔   |
| `subscription.upgrade`              | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| `subscription.billing_history.view` | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | ✔   | —   | —   | —   | —   | —   |

Per PRD FR-16.7/API.md §4.8, only the Owner can invoke `POST /v1/subscription/upgrade` — this is a hard rule, not a configurable default; `subscription.upgrade` is never assignable to any other role, including a custom role, since trial-to-paid conversion is treated as a company-level financial commitment.

## 19. Export & Import

| Permission Code         | OW                                             | CA  | BM  | AM  | CS  | IM  | WE  | PO  | SE  | AC  | FM  | AU  | CX  | MK  | DE  | TS  | RO  |
| ----------------------- | ---------------------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `data.export.reports`   | _(see §11 `reports.export`, same code family)_ |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| `data.export.catalog`   | ✔                                              | ✔   | ✔   | —   | —   | ✔   | —   | —   | —   | —   | —   | ✔   | —   | —   | —   | —   | —   |
| `data.export.customers` | ✔                                              | ✔   | ✔   | —   | —   | —   | —   | —   | —   | —   | —   | ✔   | ✔   | —   | —   | —   | —   |
| `data.import.catalog`   | ✔                                              | ✔   | ✔\* | —   | —   | ✔\* | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |

_Bulk import is treated as high-risk (can affect many products/prices at once); `data.import.catalog`\* for Branch Manager/Inventory Manager is only granted where the company has explicitly enabled bulk-import for non-Owner roles (an Owner/Company-Administrator-controlled setting per §16)._

## 20. Branch-Level vs. Company-Level Permission Scope Rules

- Every permission in this matrix is evaluated against `user_branch_roles` for the specific `branchId` in the request context (API.md §2.2) — a user's role can differ per branch, so their effective permission set can differ per branch too.
- **Owner** is the sole role with an implicit company-wide grant of every `*.view` permission across every branch without an explicit `user_branch_roles` row per branch (PRD FR-2.4) — this is a structural exception documented here, not a lint-invisible special case: the Application layer's permission resolver checks `role = Owner` as a first-match short-circuit before falling through to the normal per-branch lookup.
- **Cross-branch write actions** (e.g., a transfer between two branches' warehouses) require the acting user to hold the relevant permission (`inventory.transfer.create`) at the _source_ branch; approval/receive-side permissions are separately checked at the _destination_ branch — a user is never assumed to have equivalent standing at both ends of a transfer.
- **Company-level permissions** (`company.edit`, `settings.company.edit`, `subscription.*`, `roles.create_custom`, `tax.eta.activate_module`) have no branch dimension at all — they are granted or not, company-wide, independent of `user_branch_roles`.

## 21. Platform Administration Permissions (Separate System — Reference Only)

Per Architecture.md §3.1 and Security.md §11, Platform Administration is **not** part of the tenant permission system above — no tenant role, including Owner, holds any of the codes below, and no custom role can ever be composed to include one. They are listed here only for completeness/cross-reference, using the same `module.action` documentation convention for consistency.

| Permission Code                    | `super_admin` | `support` |
| ---------------------------------- | ------------- | --------- |
| `platform.accounts.view`           | ✔             | ✔         |
| `platform.accounts.plan.change`    | ✔             | —         |
| `platform.accounts.override.grant` | ✔             | —         |
| `platform.accounts.suspend`        | ✔             | —         |
| `platform.accounts.reactivate`     | ✔             | —         |
| `platform.accounts.trial.extend`   | ✔             | —         |
| `platform.audit.view`              | ✔             | ✔         |
| `platform.admins.manage`           | ✔             | —         |

Per Database.md §2.16.2, `platform_admins.role` is exactly `super_admin` or `support` for v1; `support` is deliberately view-plus-limited-action only (no override/lock capability), matching FR-19.7's "strongest authentication, narrowest blast radius per role" intent. Multi-tier Platform Admin role management beyond this two-role split is a Stage 8 (Implementation_Pipeline.md Step 34) deferred capability.

---

_Permission_Matrix.md — the authoritative default-grant table for the Roles & Permissions Builder (UI_UX.md §2.6); every permission code here must exist as a row in the `permissions` table (Database.md §2.5) with an identical `code` string, per Coding_Standards.md §4's exact-naming-match rule._
