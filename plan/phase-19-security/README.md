# Phase 19 — Performance Optimization

## Purpose

Performance hardening to meet NFR-1 (POS sale completion under 300ms on the low-end hardware baseline). Bundle size optimization, lazy loading, code splitting, read-model query optimization, large export streaming, and sync backlog pagination load testing. No new features — this phase exclusively improves speed, bundle size, and resource efficiency of all prior phases.

## Scope

- **POS Benchmark**: measure POS sale completion on the defined low-end hardware profile; identify every path exceeding 300ms; fix until NFR-1 is met
- **Lazy Loading**: all non-POS routes lazy-loaded; POS module loaded eagerly; all report and settings routes are dynamic imports
- **Code Splitting**: per-feature module splitting; vendor bundle separated from feature bundles; shared-kernel and ui-components extracted to shared chunk
- **Read-Model Query Optimization**: identify report queries exceeding 200ms on the benchmark dataset; add indexes or pre-aggregated rollup collections (daily_sales_rollup, monthly_sales_rollup) as needed
- **Large Export Streaming**: CSV and PDF export stream responses rather than buffering in memory; tested against a 50,000-row order dataset
- **Sync Backlog Load Test**: simulate a device that was offline for 4 weeks accumulating events; measure catch-up time and memory usage during replay; fix if backlog processing blocks UI thread
- **Bundle Size Audit**: measure and document initial bundle size per app; remove unused dependencies; tree-shake unused icon sets and locale data
- **Memory Profiling**: profile POS flow for memory leaks; profile sync engine for unbounded growth during long sessions
- **Database Index Audit**: review all query patterns from phases 03–17; add missing indexes; remove unused indexes

## Expected Output

Performance optimization complete where:

- POS sale completes in under 300ms on low-end hardware profile (NFR-1 gate met)
- Initial bundle sizes are documented and within defined budgets
- Large CSV export (50,000 rows) streams without OOM error
- Sync backlog catch-up for 4-week offline period completes within defined time budget without blocking UI
- All report queries complete within 200ms on the benchmark dataset

## Documents Referenced

- Testing.md §10
- Reports.md §7
- Architecture.md §9

## Included Modules

- `packages/infrastructure/mongodb/indexes/*` (all index definitions reviewed and updated)
- `packages/infrastructure/reports/streaming-csv-exporter.ts` (updated for streaming)
- `packages/application/sync/src/backlog-paginator.ts`
- `apps/desktop/src/bootstrap/bundle-analysis-report.md`
- `apps/android/src/bootstrap/bundle-analysis-report.md`
- `apps/backend/src/benchmark/pos-sale-benchmark.ts`
- `apps/backend/src/benchmark/sync-backlog-benchmark.ts`
