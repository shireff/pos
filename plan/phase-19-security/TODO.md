# Phase 19 — Performance Optimization TODO
> ⚠️ **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
> - **ALL UI text MUST use `useT()` / `t()` with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use `apps/backend/src/lib/errors.ts` with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.
> - **ALL UI styling MUST use the `@packages/ui-components` design system — NO inline styles (`style={{...}}`) are allowed anywhere.** Do not hardcode styling; always use the shared design-system components and design tokens.


## POS Sale Benchmark (NFR-1 Gate)

- [ ] Define low-end hardware profile: Intel Celeron equivalent, 4GB RAM, HDD (not SSD); document in `apps/backend/src/benchmark/hardware-profile.md`
- [ ] Implement `pos-sale-benchmark.ts` (`apps/backend/src/benchmark/pos-sale-benchmark.ts`): measures end-to-end time from CreateSaleCommand call to OrderCompleted event emitted; uses realistic product catalog and inventory state; runs 100 iterations, reports p50/p95/p99
- [ ] Run benchmark; identify any path exceeding 300ms; fix before moving on
- [ ] Common fixes to check: unnecessary re-read after write, synchronous MongoDB index miss, over-eager permission join, event bus synchronous fan-out blocking sale completion

## Bundle Size Optimization

- [ ] Audit Desktop bundle: run `vite build --mode analyze`; identify largest chunks; document in `apps/desktop/src/bootstrap/bundle-analysis-report.md`
- [ ] Audit Android bundle: same analysis for Capacitor app
- [ ] Lazy load all non-POS routes: reports, settings, customers, suppliers, purchases — all dynamic imports
- [ ] POS module (`apps/desktop/src/features/pos`) kept as eagerly loaded chunk
- [ ] Split vendor bundle: recharts, react, react-dom in separate vendor chunk
- [ ] Remove unused icon subsets: tree-shake to only import used icons
- [ ] Remove unused locale data: only load ar-EG and en-US locale data, not full intl dataset

## Code Splitting

- [ ] Implement route-level code splitting in `apps/desktop/src/app/App.tsx`: all feature routes use React.lazy + Suspense with skeleton fallback
- [ ] Same for `apps/android/src/app/App.tsx`
- [ ] Verify POS route does not incur additional lazy-load delay

## Read-Model Query Optimization

- [ ] Run EXPLAIN on all report queries against 12-month sample dataset
- [ ] Identify queries exceeding 200ms; add compound indexes or pre-aggregated rollup collections as needed
- [ ] Create `daily_sales_rollup` compound index (companyId, branchId, date) if not already optimized
- [ ] Create `monthly_sales_rollup` compound index (companyId, branchId, year, month)
- [ ] Inventory list query optimization: stock_items index (companyId, warehouseId, quantityOnHand) for reorder-filter queries

## Large Export Streaming

- [ ] Update `packages/infrastructure/reports/csv-streamer.ts` to use Node.js Transform stream; pipe rows directly to HTTP response without buffering full dataset
- [ ] Test against 50,000-row orders dataset: memory usage must not exceed 50MB during stream
- [ ] Update PDF export to use streaming-compatible headless render

## Sync Backlog Load Test

- [ ] Implement `sync-backlog-benchmark.ts` (`apps/backend/src/benchmark/sync-backlog-benchmark.ts`): creates 4-week worth of simulated events; measures catch-up replay time and memory usage during sync inbox processing
- [ ] Implement backlog pagination in sync inbox processor (`packages/application/sync/src/backlog-paginator.ts`): process events in batches of 500; yield between batches to avoid blocking UI thread
- [ ] Define acceptable time budget: 4-week backlog must complete within 60 seconds; document in benchmark report

## Memory Profiling

- [ ] Profile POS Register page for memory leaks during a simulated 4-hour shift (1000 transactions): verify heap does not grow unbounded
- [ ] Profile sync engine during 1-hour online session: verify outbox/inbox queues do not accumulate stale entries

## Database Index Audit

- [ ] Review all queries from phases 03–17 against MongoDB query plans
- [ ] Add missing compound indexes where query planner shows COLLSCAN
- [ ] Drop unused indexes (any index not referenced in any query for 30+ days by profiler)
- [ ] Document final index inventory in `packages/infrastructure/mongodb/indexes/index-inventory.md`

## Bundle Analysis Reporting

- [ ] `apps/desktop/src/bootstrap/bundle-analysis-report.md`: initial vs final bundle size per chunk
- [ ] `apps/android/src/bootstrap/bundle-analysis-report.md`: same
- [ ] Document all optimizations applied and their measured impact

## Tests

- [ ] See TESTS.md

### Quality Gates

- [ ] Zero TypeScript errors
- [ ] All tests passing
- [ ] Update API.md if any endpoint contract was refined during implementation