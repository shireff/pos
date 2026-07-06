# Phase 13 — Reports & Dashboards

## Purpose

All reports from Reports.md, read-model materialization layer (CQRS — separate read projections from write-side aggregates), role-based dashboards, offline report parity with online, scheduled report delivery, and export in PDF/CSV/JSON. Requires Phase 12 (sync) to be stable before read-models are built on top of synced data.

## Scope

- **Read-Model Layer**: projection worker subscribes to domain events and materializes pre-aggregated read models in separate collections; reports read from these materialized views, never from live transaction collections
- **Reports (11)**: Daily Sales Summary, Profit & Loss, Inventory Valuation, Stock Movement, Branch Comparison, Employee Performance, Customer & Loyalty, Tax/ETA, Supplier Performance, Store Health Dashboard (stub — full AI in Phase 15), Cash Flow (scaffold — full AI in Phase 15)
- **KPI Registry**: named KPI definitions with formula, data source, and display metadata — no hardcoded KPI logic in UI components
- **Dashboards**: Owner dashboard (P&L, revenue trend, branch comparison, top products), Branch Manager dashboard (daily summary, inventory alerts, staff performance), Cashier dashboard (shift summary, own sales stats)
- **Export**: PDF export via headless render, CSV streaming export (no full buffer for large datasets), JSON export
- **Scheduled Delivery**: daily/weekly report delivery via notification channel (email + in-app) per user preference
- **Offline Parity**: reports computed from locally available data when offline — same report structure, data limited to local branch scope
- **Permissions**: reports.view, reports.export, reports.schedule, reports.all_branches (Owner only)
- **Sync**: report read-models are derived from synced event stream — they rebuild on replay, never need direct sync

## Expected Output

A working reports module where:

- All 11 reports render with real data from materialized read-models
- PDF and CSV export work for all report types
- Dashboards show role-appropriate KPIs
- Offline reports show locally available data with scope indicators
- Scheduled report delivery fires daily/weekly as configured

## Documents Referenced

- Reports.md (all sections)
- Architecture.md §4
- API.md §4.6
- Business_Rules.md §16

## Included Modules

- `packages/application/reports/src/projection-worker.ts`
- `packages/application/reports/src/reports/*` (11 report handlers)
- `packages/application/reports/src/kpi-registry.ts`
- `packages/infrastructure/mongodb/migrations/013_reports_schema.ts`
- `packages/infrastructure/reports/pdf-renderer.ts`
- `packages/infrastructure/reports/csv-streamer.ts`
- `apps/backend/src/http/reports/*`
- `packages/ui-components/src/reports/*`
- `apps/desktop/src/features/reports/*`
- `apps/android/src/features/reports/*`
