# Phase 13 — Reports & Dashboards Dependencies

## Incoming

- Phase 12 (Offline Sync) — sync must be proven correct before reports are built on synced data
- All prior feature phases (03–11) — reports consume data from every domain

## Outgoing

- Phase 15 (AI Services) — AI reads from these same read models (Store Health Score, Predictions); read-model layer must be stable before AI consumes it

## Documents Used

- Reports.md (ALL sections — primary document for this phase)
- Architecture.md §4 (CQRS — reports read from denormalized read models, never transactional tables)
- API.md §4.6 (report endpoints)
- Business_Rules.md §16 (BR-REP-001 through BR-REP-007)
- UI_UX.md §2.5 (Report Viewer, Store Health Dashboard)
- Design_System.md §6 (tables, charts)
- Notifications.md §5 (scheduled report delivery)

## Shared Modules Produced

- `apps/backend/src/workers/report-materialization/` — projection worker (consumed by Phase 15 AI)
- All report read-model collections (consumed by Phase 15 AI for forecasting)
- `packages/ui-components/src/reports/*` — Report Viewer, Dashboard components (shared Desktop + Android)
- KPI definitions registry — canonical formula source for every metric
