# Phase 09 — Suppliers Checklist

A phase is **complete** when every item below is checked.

## Database

- [x] Migration `009_suppliers_schema.ts` applies cleanly
- [x] supplier_ledger_entries repository BLOCKS UPDATE and DELETE — verified by contract test

## Domain

- [x] Supplier aggregate with contacts implemented
- [x] SupplierLedgerEntry as append-only entity implemented
- [x] Ledger balance projection: sum of signed amounts correct
- [x] On-time delivery rate formula is deterministic and tested
- [x] Price variance formula is deterministic and tested
- [x] Performance narrative slot returns stub string (not LLM) until Phase 15

## Application

- [x] All 7 commands and 3 queries implemented
- [x] DeactivateSupplierCommand blocked if open PO references supplier
- [x] Ledger balance rebuilds correctly from event replay

## API

- [x] All 10 endpoints with permission enforcement tested

## Sync

- [x] suppliers: Class B sync
- [x] supplier_ledger_entries: Class A sync

## Desktop UI

- [x] Supplier List with balance and on-time rate indicators
- [x] Supplier Profile all tabs functional
- [x] Payment and credit note dialogs work

## Android UI

- [x] Same screens on Android

## Tests

- [x] Ledger balance projection test passes
- [x] On-time delivery rate computation test passes
- [x] Price variance computation test passes

## Quality Gates

- [x] Zero TypeScript errors
- [x] Zero ESLint errors
- [x] All tests passing in CI
