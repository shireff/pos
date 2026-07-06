# Phase 08 — Customers Checklist

A phase is **NOT complete** until every item below is checked.

## Database

- [ ] Migration `008_customers_schema.ts` applies cleanly
- [ ] loyalty_events repository BLOCKS UPDATE and DELETE — verified by contract test
- [ ] credit_ledger_entries repository BLOCKS UPDATE and DELETE — verified by contract test
- [ ] Unique index on (companyId, phone) enforced

## Domain

- [ ] Customer aggregate implemented
- [ ] LoyaltyAccount aggregate: balance always a projection of loyalty_events — never a direct field write
- [ ] CreditLedger aggregate: balance always a projection of credit_ledger_entries
- [ ] Loyalty tier computation from balance thresholds works correctly
- [ ] Credit limit enforcement rejects sales that would exceed limit
- [ ] Customer merge correctly moves all events and deactivates source

## Application

- [ ] All 9 commands and 3 queries implemented with handlers
- [ ] AccrueLoyaltyPointsCommand fires on OrderCompleted event
- [ ] ReverseLoyaltyPointsCommand fires on ReturnApproved event (BR-SAL-007)

## API

- [ ] All customer endpoints tested with permission enforcement
- [ ] Customer search by phone/code/email works

## Sync

- [ ] customers: Class B sync
- [ ] loyalty_events and credit_ledger_entries: Class A sync

## Desktop UI

- [ ] Customer List with tier badge and balance columns renders
- [ ] Customer Profile with all tabs works
- [ ] Loyalty redemption dialog shows correct available points

## Android UI

- [ ] Bottom-sheet customer search at POS works on Android

## Tests

- [ ] Loyalty balance projection test: replay events, verify balance
- [ ] Loyalty reversal on return (BR-SAL-007) test passes
- [ ] Credit limit enforcement test passes
- [ ] Customer merge idempotency test passes

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing in CI
