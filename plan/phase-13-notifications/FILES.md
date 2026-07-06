# Phase 13 — Reports & Dashboards Files

## Database Migrations & Schemas

```
packages/infrastructure/mongodb/migrations/013_reports_schema.ts
packages/infrastructure/mongodb/schemas/daily_sales_rollup.schema.json
packages/infrastructure/mongodb/schemas/monthly_sales_rollup.schema.json
packages/infrastructure/mongodb/schemas/inventory_valuation_snapshot.schema.json
packages/infrastructure/mongodb/schemas/employee_performance_snapshot.schema.json
packages/infrastructure/mongodb/schemas/customer_loyalty_snapshot.schema.json
```

## Application — Reports & Projections

```
packages/application/reports/src/projection-worker.ts
packages/application/reports/src/projection-worker.test.ts
packages/application/reports/src/kpi-registry.ts
packages/application/reports/src/reports/daily-sales-summary.report.ts
packages/application/reports/src/reports/pnl.report.ts
packages/application/reports/src/reports/inventory-valuation.report.ts
packages/application/reports/src/reports/stock-movement.report.ts
packages/application/reports/src/reports/branch-comparison.report.ts
packages/application/reports/src/reports/employee-performance.report.ts
packages/application/reports/src/reports/customer-loyalty.report.ts
packages/application/reports/src/reports/tax-eta.report.ts
packages/application/reports/src/reports/supplier-performance.report.ts
packages/application/reports/src/reports/store-health-stub.report.ts
packages/application/reports/src/reports/cash-flow-scaffold.report.ts
packages/application/reports/src/scheduled-delivery.service.ts
packages/application/reports/src/index.ts
```

## Infrastructure — Reports

```
packages/infrastructure/reports/pdf-renderer.ts
packages/infrastructure/reports/csv-streamer.ts
packages/infrastructure/reports/csv-streamer.test.ts
packages/infrastructure/reports/json-exporter.ts
```

## API (Backend)

```
apps/backend/src/http/reports/reports.controller.ts
apps/backend/src/http/reports/reports.controller.test.ts
apps/backend/src/http/reports/reports.schemas.ts
```

## Shared UI Components

```
packages/ui-components/src/reports/ReportFilterBar.tsx
packages/ui-components/src/reports/KpiCard.tsx
packages/ui-components/src/reports/ReportChart.tsx
packages/ui-components/src/reports/ExportButton.tsx
packages/ui-components/src/reports/OfflineScopeIndicator.tsx
packages/ui-components/src/reports/index.ts
```

## Dashboard Components

```
packages/ui-components/src/dashboards/OwnerDashboard.tsx
packages/ui-components/src/dashboards/BranchManagerDashboard.tsx
packages/ui-components/src/dashboards/CashierDashboard.tsx
```

## Desktop UI

```
apps/desktop/src/features/reports/DailySalesSummaryPage.tsx
apps/desktop/src/features/reports/PnlReportPage.tsx
apps/desktop/src/features/reports/InventoryValuationPage.tsx
apps/desktop/src/features/reports/StockMovementPage.tsx
apps/desktop/src/features/reports/BranchComparisonPage.tsx
apps/desktop/src/features/reports/EmployeePerformancePage.tsx
apps/desktop/src/features/reports/CustomerLoyaltyPage.tsx
apps/desktop/src/features/reports/TaxEtaPage.tsx
apps/desktop/src/features/reports/SupplierPerformancePage.tsx
apps/desktop/src/features/reports/StoreHealthPage.tsx
apps/desktop/src/features/reports/CashFlowPage.tsx
apps/desktop/src/features/dashboard/DashboardPage.tsx
```

## Android UI

```
apps/android/src/features/reports/ReportsNavigationPage.tsx
apps/android/src/features/dashboard/DashboardPage.tsx
```

## State Management

```
packages/ui-components/src/stores/reports.store.ts
```
