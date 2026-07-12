# Phase 16 — Hardware Integration Checklist

A phase is **NOT complete** until every item below is checked.

## HAL Interfaces

- [x] All 4 interfaces defined with correct TypeScript method signatures and return types
- [x] All 4 No-op adapters implement interfaces correctly

## Graceful Fallbacks — MANDATORY: every hardware failure produces graceful behavior

- [x] Printer unavailable → DigitalReceiptModal shown — verified by contract test
- [x] Cash drawer not connected → audit entry logged, sale NOT blocked — verified by contract test
- [x] Scanner not connected → manual barcode entry input shown — verified by contract test
- [x] Scale not connected → manual weight entry prompt shown — verified by contract test
- [x] No raw error messages exposed to cashier in any hardware failure scenario

## Desktop Adapters (Tauri)

- [x] TauriEscPosPrinterAdapter works end-to-end with real printer (or documented as tested)
- [x] TauriHidBarcodeScannerAdapter correctly parses HID wedge keystroke sequence
- [x] TauriCashDrawerAdapter sends drawer open pulse without blocking
- [x] TauriUsbScaleAdapter reads weight without blocking

## Android Adapters — ZERO KOTLIN/JAVA CODE ALLOWED

- [x] CapacitorCameraBarcodeScannerAdapter works with @capacitor-community/barcode-scanner
- [x] CapacitorBluetoothPrinterAdapter works with @capacitor-community/bluetooth-le
- [x] CapacitorUsbSerialAdapter works for connected peripherals
- [x] CI check verifies zero Kotlin/Java files in adapter layer

## Arabic RTL Receipt

- [x] Arabic RTL receipt template renders correctly with sample Arabic product names
- [x] Mixed-direction text (Arabic + numeric) renders without character-joining artifacts

## Digital Receipt Fallback

- [x] DigitalReceiptModal renders complete receipt with copy-to-clipboard and send options

## Contract Tests (ALL must pass in CI WITHOUT physical hardware)

- [x] `printer-contract.test.ts` PASSES
- [x] `scanner-contract.test.ts` PASSES
- [x] `cash-drawer-contract.test.ts` PASSES
- [x] `scale-contract.test.ts` PASSES

## DI Registration

- [x] Tauri adapters used in Desktop environment
- [x] Capacitor adapters used in Android environment
- [x] Noop adapters used in CI environment

## Quality Gates

- [x] Zero TypeScript errors
- [x] Zero ESLint errors
- [x] All contract tests passing in CI without physical hardware
