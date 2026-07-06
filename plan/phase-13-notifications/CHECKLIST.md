# Phase 13 — Reports & Dashboards Checklist

A phase is **NOT complete** until every item below is checked.

## Projection Worker

- [ ] Projection worker subscribes to all required domain events
- [ ] daily_sales_rollup updates correctly on OrderCompleted and ReturnApproved
- [ ] Projection worker is idempotent on eventId replay

## Reports (11)

- [ ] Daily Sales Summary report renders with real data
- [ ] Profit & Loss report renders with real data
- [ ] Inventory Valuation report renders with real data
- [ ] Stock Movement report renders with paginated events
- [ ] Branch Comparison report Owner-only access enforced
- [ ] Employee Performance report renders with shift data
- [ ] Customer Loyalty report renders with tier distribution
- [ ] Tax/ETA report renders (ETA submission still disabled)
- [ ] Supplier Performance report renders with on-time rate
- [ ] Store Health Dashboard stub renders placeholder structure
- [ ] Cash Flow scaffold renders basic cash flow data

## Dashboards

- [ ] Owner Dashboard loads with correct KPIs
- [ ] Branch Manager Dashboard loads with correct KPIs
- [ ] Cashier Dashboard loads with correct shift data
- [ ] Each dashboard shows role-appropriate data only

## Export

- [ ] PDF export works for all report types
- [ ] CSV streaming export works without OOM on 50,000-row dataset
- [ ] JSON export works

## Offline Parity

- [ ] Reports work offline using local data
- [ ] Offline scope indicator displayed when data is limited to local branch

## Scheduled Delivery

- [ ] Daily scheduled delivery fires at configured time
- [ ] Weekly scheduled delivery fires at configured time

## Tests

- [ ] Projection worker idempotency test passes
- [ ] All 11 report data-shape tests pass
- [ ] CSV streaming test passes (50,000 rows, memory under budget)

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
