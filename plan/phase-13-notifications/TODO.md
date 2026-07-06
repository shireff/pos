# Phase 13 — Reports & Dashboards TODO

## Database

- [ ] Create migration `013_reports_schema.ts`: read-model collections: daily_sales_rollup, monthly_sales_rollup, inventory_valuation_snapshot, employee_performance_snapshot, customer_loyalty_snapshot
- [ ] daily_sales_rollup: unique index (companyId, branchId, date)
- [ ] monthly_sales_rollup: unique index (companyId, branchId, year, month)
- [ ] All read-model collections: append-on-date, upsert-on-recompute pattern

## Projection Worker

- [ ] Implement `projection-worker.ts` (`packages/application/reports/src/projection-worker.ts`): subscribes to domain events via internal event bus; routes each event to its rollup updater; idempotent on eventId
- [ ] Rollup updater for OrderCompleted: upsert daily_sales_rollup (add grossRevenue, taxAmount, discountAmount, transactionCount)
- [ ] Rollup updater for ReturnApproved: adjust daily_sales_rollup (subtract return amounts)
- [ ] Rollup updater for StockMovementRecorded: update inventory_valuation_snapshot
- [ ] Rollup updater for ShiftClosed: update employee_performance_snapshot
- [ ] Monthly rollup job: nightly aggregation of daily rollups into monthly

## KPI Registry

- [ ] Implement `kpi-registry.ts`: named KPI definitions with formula (pure function), data source collection name, display metadata (label, format, unit)
- [ ] Register KPIs: grossRevenue, netRevenue, grossProfit, grossMarginPercent, transactionCount, averageOrderValue, returnsCount, returnsRate, loyaltyRedemptionRate, stockTurnoverRate, daysInventoryOutstanding

## Report Handlers (11)

- [ ] `DailySalesSummaryReport`: reads daily_sales_rollup; hourly breakdown; top products; payment method split
- [ ] `ProfitAndLossReport`: reads monthly rollup; revenue - COGS - expenses; gross profit, net profit
- [ ] `InventoryValuationReport`: snapshot valuation (FIFO cost) per product; total portfolio value
- [ ] `StockMovementReport`: reads stock_movement_events by date range and warehouse; net flow per product
- [ ] `BranchComparisonReport`: aggregates across branches for Owner; KPI matrix per branch
- [ ] `EmployeePerformanceReport`: reads employee_performance_snapshot; orders/hour, average sale value, return rate per cashier
- [ ] `CustomerLoyaltyReport`: reads customer_loyalty_snapshot; tier distribution, redemption rate, acquisition rate
- [ ] `TaxEtaReport`: tax collected by rate/period; ETA-formatted breakdown (submission disabled, display only)
- [ ] `SupplierPerformanceReport`: reads supplier ledger and receipt data; on-time rate, price variance, purchase volume
- [ ] `StoreHealthDashboardStub`: returns static structure with placeholders — full AI narrative in Phase 15
- [ ] `CashFlowScaffold`: reads payment transactions by type and date; inflow/outflow by tender — AI prediction in Phase 15

## Dashboards (3)

- [ ] Owner Dashboard: P&L widget, revenue trend (30-day sparkline), branch comparison table, top products widget, gross margin gauge
- [ ] Branch Manager Dashboard: daily summary, inventory alerts (below reorder), shift performance, staff metrics
- [ ] Cashier Dashboard: my shift summary, my sales stats, current shift progress

## Export

- [ ] PDF export: headless render of report component, generate PDF; streaming-compatible
- [ ] CSV streaming export (`packages/infrastructure/reports/csv-streamer.ts`): streams rows to HTTP response; no full buffer in memory; tested on 50,000-row dataset
- [ ] JSON export: structured download of report data

## Scheduled Delivery

- [ ] Scheduled delivery service: per-user report subscription (report type, frequency: daily/weekly, channel: email/in-app); fires at scheduled time via cron-style job; calls notification dispatcher

## Offline Parity

- [ ] All reports work offline against locally available data (limited to local branch scope)
- [ ] Offline scope indicator on report headers when data is limited to local branch

## API Endpoints

- [ ] `GET /v1/reports/daily-sales` — query params: branchId, date
- [ ] `GET /v1/reports/pnl` — query params: branchId?, year, month
- [ ] `GET /v1/reports/inventory-valuation` — query params: warehouseId?, date
- [ ] `GET /v1/reports/stock-movements` — query params: productId?, warehouseId, from, to
- [ ] `GET /v1/reports/branch-comparison` — Owner only, query params: from, to
- [ ] `GET /v1/reports/employee-performance` — query params: branchId, from, to
- [ ] `GET /v1/reports/customer-loyalty` — query params: from, to
- [ ] `GET /v1/reports/tax` — query params: year, month
- [ ] `GET /v1/reports/supplier-performance` — query params: supplierId?, from, to
- [ ] `GET /v1/reports/:type/export` — params: format enum(pdf/csv/json), same filter params

## Permissions

- [ ] Enforce `reports.view` on all GET report endpoints
- [ ] Enforce `reports.export` on export endpoints
- [ ] Enforce `reports.all_branches` on branch-comparison (Owner only)

## Desktop UI

- [ ] Reports navigation sidebar with all 11 report types
- [ ] Each report page with filter bar, chart area (recharts), KPI cards, export buttons
- [ ] Dashboard pages per role (auto-selected on login)

## Android UI

- [ ] Same report pages in single-column scrollable layout
- [ ] Charts adapted for mobile (simplified, touch-friendly)

## Tests

- [ ] See TESTS.md
