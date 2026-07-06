# Phase 19 — Performance Optimization Files

## Benchmark & Profiling

```
infra/benchmarks/pos-sale-latency.bench.ts
infra/benchmarks/report-generation.bench.ts
infra/benchmarks/sync-backlog-catchup.bench.ts
infra/benchmarks/product-search.bench.ts
infra/benchmarks/low-end-hardware-profile.ts
```

## Read-Model Optimizations

```
packages/infrastructure/mongodb/migrations/019_rollup_indexes.ts
packages/infrastructure/mongodb/read-models/daily-sales-rollup.ts
packages/infrastructure/mongodb/read-models/monthly-sales-rollup.ts
packages/infrastructure/mongodb/read-models/inventory-rollup.ts
```

## Bundle Optimization Config

```
apps/desktop/vite.config.ts (updated: code splitting, lazy routes)
apps/android/vite.config.ts (updated: code splitting, lazy routes)
```

## Streaming Export

```
apps/backend/src/http/reports/streaming-export.middleware.ts
apps/backend/src/http/reports/streaming-export.middleware.test.ts
```
