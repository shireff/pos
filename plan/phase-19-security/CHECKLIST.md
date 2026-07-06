# Phase 19 — Performance Optimization Checklist

A phase is **NOT complete** until every item below is checked.

## **POS Sale < 300ms on Low-End Hardware — MANDATORY EXIT GATE (NFR-1)**

- [ ] Benchmark test defined with low-end hardware profile specification documented
- [ ] POS sale benchmark runs 100 iterations and reports p50/p95/p99
- [ ] p99 POS sale completion time < 300ms on low-end hardware profile
- [ ] Every individual fix for identified slow paths is documented

## Bundle Size

- [ ] Desktop initial bundle size documented in bundle-analysis-report.md (before and after)
- [ ] Android initial bundle size documented (before and after)
- [ ] All non-POS routes use React.lazy + Suspense
- [ ] POS module loads eagerly (no lazy-load delay at cashier)
- [ ] Unused icon sets and locale data removed

## Code Splitting

- [ ] Vendor chunk separated from feature chunks
- [ ] Feature modules split at route boundaries
- [ ] Split does not introduce any loading artifacts on POS route

## Query Optimization

- [ ] All report queries run under 200ms on 12-month sample dataset
- [ ] COLLSCAN on any report query eliminated
- [ ] daily_sales_rollup and monthly_sales_rollup compound indexes verified in query planner

## Large Export Streaming

- [ ] CSV streaming uses Transform stream (no full buffer in memory)
- [ ] 50,000-row orders export completes without OOM error
- [ ] Memory usage during 50,000-row export is under 50MB

## Sync Backlog

- [ ] 4-week backlog catch-up completes within 60 seconds
- [ ] Backlog processing does not block UI thread (batch processing with yields between batches verified)

## Memory

- [ ] No heap leak detected in POS page during 4-hour simulated shift (1000 transactions)
- [ ] Sync engine outbox/inbox does not accumulate stale entries during long online sessions

## Index Audit

- [ ] Index inventory document updated with final set of all indexes
- [ ] No COLLSCAN found on any production query path

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
- [ ] NFR-1 gate (POS < 300ms) verified and documented with benchmark results
