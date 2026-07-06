# Phase 19 — Performance Optimization Dependencies

## Incoming

- Phases 01–18 all complete — optimization targets require the full feature set to exist and be measurable

## Outgoing

- Phase 20 (Final QA) — NFR-1 (POS sale <300ms) must be verified in final regression

## Documents Used

- Testing.md §10 (low-end hardware baseline, performance regression tests)
- Reports.md §7 (streaming exports, pre-aggregated rollup tables)
- Architecture.md §9 (scalability path)
- Configuration_System.md §17 (performance settings)
- PRD.md NFR-1 (POS sale <300ms on low-end hardware target)

## Key Targets

- NFR-1: POS sale completion (scan-to-receipt) <300ms on low-end hardware baseline
- Large CSV export (10,000+ rows): streams, never buffers in memory
- Report generation for heavy reports: reads pre-aggregated rollup tables, not raw events
- Sync backlog catch-up (weeks of queued data): memory and time bounded
- Initial app load: lazy-loaded feature routes reduce initial bundle
