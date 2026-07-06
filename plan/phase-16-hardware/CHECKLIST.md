# Phase 16 — Hardware Integration Checklist

A phase is **NOT complete** until every item below is checked.

## HAL Interfaces

- [ ] All 4 interfaces defined with correct TypeScript method signatures and return types
- [ ] All 4 No-op adapters implement interfaces correctly

## Graceful Fallbacks — MANDATORY: every hardware failure produces graceful behavior

- [ ] Printer unavailable → DigitalReceiptModal shown — verified by contract test
- [ ] Cash drawer not connected → audit entry logged, sale NOT blocked — verified by contract test
- [ ] Scanner not connected → manual barcode entry input shown — verified by contract test
- [ ] Scale not connected → manual weight entry prompt shown — verified by contract test
- [ ] No raw error messages exposed to cashier in any hardware failure scenario

## Desktop Adapters (Tauri)

- [ ] TauriEscPosPrinterAdapter works end-to-end with real printer (or documented as tested)
- [ ] TauriHidBarcodeScannerAdapter correctly parses HID wedge keystroke sequence
- [ ] TauriCashDrawerAdapter sends drawer open pulse without blocking
- [ ] TauriUsbScaleAdapter reads weight without blocking

## Android Adapters — ZERO KOTLIN/JAVA CODE ALLOWED

- [ ] CapacitorCameraBarcodeScannerAdapter works with @capacitor-community/barcode-scanner
- [ ] CapacitorBluetoothPrinterAdapter works with @capacitor-community/bluetooth-le
- [ ] CapacitorUsbSerialAdapter works for connected peripherals
- [ ] CI check verifies zero Kotlin/Java files in adapter layer

## Arabic RTL Receipt

- [ ] Arabic RTL receipt template renders correctly with sample Arabic product names
- [ ] Mixed-direction text (Arabic + numeric) renders without character-joining artifacts

## Digital Receipt Fallback

- [ ] DigitalReceiptModal renders complete receipt with copy-to-clipboard and send options

## Contract Tests (ALL must pass in CI WITHOUT physical hardware)

- [ ] `printer-contract.test.ts` PASSES
- [ ] `scanner-contract.test.ts` PASSES
- [ ] `cash-drawer-contract.test.ts` PASSES
- [ ] `scale-contract.test.ts` PASSES

## DI Registration

- [ ] Tauri adapters used in Desktop environment
- [ ] Capacitor adapters used in Android environment
- [ ] Noop adapters used in CI environment

## Quality Gates

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All contract tests passing in CI without physical hardware
