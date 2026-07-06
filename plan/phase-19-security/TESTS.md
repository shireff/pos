# Phase 19 — Performance Optimization Tests

## Benchmark Tests (run against low-end hardware profile)

### benchmarks/pos-sale-latency.bench.ts

- Measure: scan barcode → product loads → add to cart → complete cash sale → receipt rendered
- Target: <300ms end-to-end (NFR-1) on low-end hardware profile
- Measured on: Desktop (low-end Windows target spec) and Android (low-end Android target spec)
- Test fails if any run exceeds 300ms after warm-up

### benchmarks/report-generation.bench.ts

- Daily Sales report for 1 branch, 1 month of data: <500ms
- Profit & Loss report for 12 months, 3 branches: <2000ms (reads rollup tables)
- Branch Comparison for 5 branches: <1000ms

### benchmarks/sync-backlog-catchup.bench.ts

- Device offline for 30 simulated days (10,000+ events): catch-up completes in <60 seconds
- Memory usage during catch-up: <200MB peak
- App remains responsive during catch-up (POS still usable)

### benchmarks/product-search.bench.ts

- Full-text search on 5,000 products: returns results in <100ms
- Barcode scan lookup on 5,000 products: <50ms

## Bundle Size Tests

- Initial bundle (before lazy loading): measured and recorded as baseline
- After optimization: initial bundle reduction ≥ 30% vs. baseline
- Feature route lazy loading: non-POS routes not loaded on initial app start
- No single chunk exceeds 500KB gzipped

## Regression Tests

- All 10 E2E critical flows still pass after optimization changes (no regressions)
- Performance benchmark is now part of CI — build fails if NFR-1 is violated on the target profile
