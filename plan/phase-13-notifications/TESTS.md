# Phase 13 — Reports & Dashboards Tests

## Unit Tests

### reports/kpi-definitions.test.ts

- Net Sales = gross sales − discounts − returns (exact formula, no variance)
- Gross Margin % = (Revenue − COGS) / Revenue (COGS from cost snapshot at time of sale, not current cost)
- Average Basket Size = Net Sales / transaction count
- Void Rate = voided line count / total line count per cashier
- Return Rate = returned units / sold units per cashier
- Customer Repeat Rate = customers with ≥2 orders / total identified customers with ≥1 order
- Same KPI name always uses same formula — no divergence between report and dashboard widget

### reports/read-model-projection.test.ts

- Re-running a projection against the same event set is idempotent (no duplicate rows)
- Projection worker updates read-model incrementally on each new Domain Event
- Report query always scoped by company_id (tenant isolation — BR-REP-003)
- Report query scoped by branch_id where applicable
- Offline report renders correctly from local event log with "as of last sync" timestamp

## Integration Tests

### reports/daily-sales.integration.test.ts

- GET /v1/reports/daily-sales?branchId=X&date=Y returns correct metrics for seeded data
- Hourly sales curve reflects actual order timestamps
- Payment method breakdown matches payments collection

### reports/profit-loss.integration.test.ts

- GET /v1/reports/profit-loss?from=X&to=Y returns correct COGS using historical cost snapshot
- Historical cost is not affected by later price changes (BR-PRC-001)
- Caller without reports.view.financial permission: 403

### reports/inventory-valuation.integration.test.ts

- Stock value at cost and retail price matches current stock projection
- Historical valuation at a past asOfDate reconstructed correctly from event log

### reports/branch-comparison.integration.test.ts

- GET /v1/reports/branch-comparison returns all branches in one response
- Caller without reports.branch_comparison.view permission: 403

### reports/export.integration.test.ts

- GET /v1/reports/daily-sales?format=csv returns valid UTF-8 with BOM CSV
- GET /v1/reports/daily-sales?format=pdf returns valid PDF with company branding
- Large export (10,000+ rows) streams instead of buffering in memory

### reports/offline-parity.integration.test.ts

- Report rendered offline from local event log matches server-rendered report for same data set

## E2E Tests (Critical Flow #7)

### e2e/flow-7-dashboard.e2e.test.ts (Critical Flow #7)

- Owner views Store Health Dashboard reflecting synced data from 2 branches
- All 5 sub-scores display (Sales, Inventory, Financial, Employee, Customer Health)
- Daily Sales report on Desktop matches same report on Android for same date
- Export to CSV on Desktop downloads file with correct data

## Scheduled Delivery Tests

- Register a scheduled report → report fires at configured time → delivered via email
- Scheduled report uses exact same read-model queries as on-demand endpoint (no separate batch logic)
