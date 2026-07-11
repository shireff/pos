# Phase 13 — Reports & Dashboards TODO

## Database

- [x] Create migration `013_reports_schema.ts`: read-model collections: daily_sales_rollup, monthly_sales_rollup, inventory_valuation_snapshot, employee_performance_snapshot, customer_loyalty_snapshot
- [x] daily_sales_rollup: unique index (companyId, branchId, date)
- [x] monthly_sales_rollup: unique index (companyId, branchId, year, month)
- [x] All read-model collections: append-on-date, upsert-on-recompute pattern

## Projection Worker

- [x] Implement `projection-worker.ts` (`packages/application/reports/src/projection-worker.ts`): subscribes to domain events via internal event bus; routes each event to its rollup updater; idempotent on eventId
- [x] Rollup updater for OrderCompleted: upsert daily_sales_rollup (add grossRevenue, taxAmount, discountAmount, transactionCount)
- [x] Rollup updater for ReturnApproved: adjust daily_sales_rollup (subtract return amounts)
- [x] Rollup updater for StockMovementRecorded: update inventory_valuation_snapshot
- [x] Rollup updater for ShiftClosed: update employee_performance_snapshot
- [x] Monthly rollup job: nightly aggregation of daily rollups into monthly

## KPI Registry

- [x] Implement `kpi-registry.ts`: named KPI definitions with formula (pure function), data source collection name, display metadata (label, format, unit)
- [x] Register KPIs: grossRevenue, netRevenue, grossProfit, grossMarginPercent, transactionCount, averageOrderValue, returnsCount, returnsRate, loyaltyRedemptionRate, stockTurnoverRate, daysInventoryOutstanding

## Report Handlers (11)

- [x] `DailySalesSummaryReport`: reads daily_sales_rollup; hourly breakdown; top products; payment method split
- [x] `ProfitAndLossReport`: reads monthly rollup; revenue - COGS - expenses; gross profit, net profit
- [x] `InventoryValuationReport`: snapshot valuation (FIFO cost) per product; total portfolio value
- [x] `StockMovementReport`: reads stock_movement_events by date range and warehouse; net flow per product
- [x] `BranchComparisonReport`: aggregates across branches for Owner; KPI matrix per branch
- [x] `EmployeePerformanceReport`: reads employee_performance_snapshot; orders/hour, average sale value, return rate per cashier
- [x] `CustomerLoyaltyReport`: reads customer_loyalty_snapshot; tier distribution, redemption rate, acquisition rate
- [x] `TaxEtaReport`: tax collected by rate/period; ETA-formatted breakdown (submission disabled, display only)
- [x] `SupplierPerformanceReport`: reads supplier ledger and receipt data; on-time rate, price variance, purchase volume
- [x] `StoreHealthDashboardStub`: returns static structure with placeholders — full AI narrative in Phase 15
- [x] `CashFlowScaffold`: reads payment transactions by type and date; inflow/outflow by tender — AI prediction in Phase 15

## Dashboards (3)

- [x] Owner Dashboard: P&L widget, revenue trend (30-day sparkline), branch comparison table, top products widget, gross margin gauge
- [x] Branch Manager Dashboard: daily summary, inventory alerts (below reorder), shift performance, staff metrics
- [x] Cashier Dashboard: my shift summary, my sales stats, current shift progress

## Export

- [x] PDF export: headless render of report component, generate PDF; streaming-compatible
- [x] CSV streaming export (`packages/infrastructure/reports/csv-streamer.ts`): streams rows to HTTP response; no full buffer in memory; tested on 50,000-row dataset
- [x] JSON export: structured download of report data

## Scheduled Delivery

- [x] Scheduled delivery service: per-user report subscription (report type, frequency: daily/weekly, channel: email/in-app); fires at scheduled time via cron-style job; calls notification dispatcher

## Offline Parity

- [x] All reports work offline against locally available data (limited to local branch scope)
- [x] Offline scope indicator on report headers when data is limited to local branch

## API Endpoints

- [x] `GET /v1/reports/daily-sales` — query params: branchId, date
- [x] `GET /v1/reports/pnl` — query params: branchId?, year, month
- [x] `GET /v1/reports/inventory-valuation` — query params: warehouseId?, date
- [x] `GET /v1/reports/stock-movements` — query params: productId?, warehouseId, from, to
- [x] `GET /v1/reports/branch-comparison` — Owner only, query params: from, to
- [x] `GET /v1/reports/employee-performance` — query params: branchId, from, to
- [x] `GET /v1/reports/customer-loyalty` — query params: from, to
- [x] `GET /v1/reports/tax` — query params: year, month
- [x] `GET /v1/reports/supplier-performance` — query params: supplierId?, from, to
- [x] `GET /v1/reports/:type/export` — params: format enum(pdf/csv/json), same filter params

## Permissions

- [x] Enforce `reports.view` on all GET report endpoints
- [x] Enforce `reports.export` on export endpoints
- [x] Enforce `reports.all_branches` on branch-comparison (Owner only)

## Desktop UI

- [x] Reports navigation sidebar with all 11 report types
- [x] Each report page with filter bar, chart area (recharts), KPI cards, export buttons
- [x] Dashboard pages per role (auto-selected on login)

## Android UI

- [x] Same report pages in single-column scrollable layout
- [x] Charts adapted for mobile (simplified, touch-friendly)

## Tests

- [x] See TESTS.md
- [x] Zero TypeScript errors
- [x] All tests passing
- [x] Update API.md if any endpoint contract was refined during implementation
