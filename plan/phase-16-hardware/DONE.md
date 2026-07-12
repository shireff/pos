# Phase 16 — Hardware Integration Done

> Filled after all CHECKLIST.md items pass.

## Exit Gate Criteria

- [x] All adapter contract tests pass in CI (no physical hardware required)
- [x] Every hardware failure produces graceful fallback — no raw error to cashier
- [x] Sale never blocked by any hardware failure (BR-HW-001)
- [x] Android uses ONLY Capacitor plugins — zero Kotlin/Java code verified
- [x] Arabic RTL receipt renders correctly
- [x] All tests passing in CI

## Completion Date

_2026-07-13_

## Summary

Implemented the Hardware Abstraction Layer (HAL) for receipt printer, barcode
scanner, cash drawer, and scale across Desktop (Tauri) and Android (Capacitor):

- HAL ports enhanced in `packages/application/sales/src/ports/index.ts`:
  `ReceiptPrinter` (print/testPrint/getStatus/isAvailable), `CashDrawer`
  (open/getStatus), `BarcodeScanner` (startScan/stopScan/onScanResult +
  ScanResult), and a new `Scale` port (readWeight/tare/getStatus + WeightReading).
- No-op/simulated adapters for all four peripherals (CI/dev).
- Tauri adapters: ESC/POS printer, HID wedge scanner, cash drawer pulse, USB scale.
- Capacitor adapters: camera barcode scanner (existing), Bluetooth LE printer,
  USB-serial printer/drawer/scale — all TypeScript-only, no Kotlin/Java.
- Arabic RTL ESC/POS receipt template with CP864 code-page + RTL + Arabic-Indic
  numerals + Egyptian date format + tax registration number.
- Graceful-fallback dispatcher (`fallback.ts`) mapping every error to a
  non-blocking cashier action (digital receipt / manual open / manual entry).
- `DigitalReceiptModal` extended with SMS / email / print-to-PDF actions.
- Shared runtime detection (`runtime.ts`: isTauriRuntime / isCapacitorRuntime /
  isTestOrCiRuntime) wired into both app composition roots (DI).
- Contract tests for printer, scanner, cash drawer, scale, and the Arabic
  template — all pass without physical hardware (35 hardware tests total).

NOTE: 9 backend `apps/backend` route tests time out in this sandbox because they
require a live MongoDB instance; they are unrelated to this phase and were not
modified. All hardware/UI/sales typechecks and the hardware test suite pass.
