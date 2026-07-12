# Phase 16 — Hardware Integration TODO
> ⚠️ **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
> - **ALL UI text MUST use `useT()` / `t()` with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use `apps/backend/src/lib/errors.ts` with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.
> - **ALL UI styling MUST use the `@packages/ui-components` design system — NO inline styles (`style={{...}}`) are allowed anywhere.** Do not hardcode styling; always use the shared design-system components and design tokens.


## HAL Interfaces

- [x] Implement `IReceiptPrinter` interface (`packages/infrastructure/hardware/src/interfaces/receipt-printer.interface.ts`): `print(template: ReceiptTemplate): Promise<PrintResult>`, `testPrint(): Promise<PrintResult>`, `getStatus(): Promise<PrinterStatus>`; define PrintResult, PrinterStatus types
- [x] Implement `IBarcodeScanner` interface: `startScan(options): void`, `stopScan(): void`, `onScanResult(callback): Unsubscribe`; define ScanResult type
- [x] Implement `ICashDrawer` interface: `open(): Promise<DrawerResult>`, `getStatus(): Promise<DrawerStatus>`
- [x] Implement `IScale` interface: `readWeight(): Promise<WeightReading>`, `tare(): Promise<void>`; define WeightReading (value: number, unit: string)

## No-Op Adapters (CI / Dev)

- [x] `NoopPrinterAdapter`: `print()` logs template to console and returns {success: true}; `getStatus()` returns {connected: false, isNoop: true}
- [x] `NoopBarcodeScannerAdapter`: `startScan()` calls onScanResult with configured test barcode after 100ms; `stopScan()` is a no-op
- [x] `NoopCashDrawerAdapter`: `open()` returns {success: true}; `getStatus()` returns {connected: false}
- [x] `NoopScaleAdapter`: `readWeight()` returns {value: 0, unit: 'kg'}; `tare()` is a no-op

## Desktop Adapters (Tauri)

- [x] `TauriEscPosPrinterAdapter`: invoke Tauri command `print_receipt` with ESC/POS byte array; handle PrinterNotReachableError, PaperOutError; both map to graceful fallback trigger
- [x] `TauriHidBarcodeScannerAdapter`: use Tauri global keyboard shortcut listener on barcode-prefix + suffix characters; parse scan string from HID wedge keystroke sequence; emit onScanResult
- [x] `TauriCashDrawerAdapter`: invoke Tauri command `open_cash_drawer` via serial port; handle DrawerNotConnectedError gracefully (log only, no cashier-visible error)
- [x] `TauriUsbScaleAdapter`: invoke Tauri command `read_scale_weight`; handle ScaleNotConnectedError (return null weight, show manual-entry prompt)

## Android Adapters (Capacitor)

- [x] `CapacitorCameraBarcodeScannerAdapter`: use @capacitor-community/barcode-scanner; request camera permission; start/stop camera scan; emit onScanResult with scanned value
- [x] `CapacitorBluetoothPrinterAdapter`: use @capacitor-community/bluetooth-le; pair and send ESC/POS byte array; handle BluetoothNotAvailableError gracefully
- [x] `CapacitorUsbSerialAdapter` (for printer, cash drawer, scale on Android): use USB serial Capacitor plugin; handle UsbNotGrantedError gracefully
- [x] Zero Kotlin/Java code: all Android adapters are TypeScript/Capacitor plugin calls only — verified by CI check

## Graceful Fallback Logic

- [x] Define fallback behavior per failure type in HAL dispatcher:
  - PrinterNotAvailable → trigger DigitalReceiptModal display
  - CashDrawerNotConnected → log audit entry, do not block sale
  - ScannerNotConnected → show manual barcode entry input
  - ScaleNotConnected → show manual weight entry input
- [x] Implement `DigitalReceiptModal.tsx`: full receipt rendered as styled component; copy-to-clipboard, offer SMS/email send, print-to-PDF

## Arabic RTL Receipt Template

- [x] Implement `ArabicRtlReceiptTemplate` (`packages/infrastructure/hardware/src/templates/arabic-rtl-receipt.template.ts`): ESC/POS byte sequence for RTL text, Arabic product names, Arabic numerals for totals, company name in Arabic, date in Egyptian format, tax registration number
- [x] Test template with sample Arabic strings including mixed-direction text (Arabic product names + numeric prices)

## Adapter Contract Tests

- [x] `printer-contract.test.ts`: test against NoopPrinterAdapter; simulate PrinterNotAvailableError → verify DigitalReceiptModal triggered
- [x] `scanner-contract.test.ts`: simulate scan sequence → verify onScanResult fires with correct barcode string; simulate ScannerNotConnected → verify fallback input shown
- [x] `cash-drawer-contract.test.ts`: simulate DrawerNotConnected → verify sale completes and audit entry logged
- [x] `scale-contract.test.ts`: simulate ScaleNotConnected → verify manual-entry prompt shown

## DI Registration

- [x] Desktop DI container: registers Tauri adapters when running in Tauri environment; registers Noop adapters in test/CI environment
- [x] Android DI container: registers Capacitor adapters when running in Capacitor environment; registers Noop adapters in test/CI environment
- [x] Environment detection: single `isCapacitorRuntime()` / `isTauriRuntime()` utility used in both DI containers

## Tests

- [x] See TESTS.md

### Quality Gates

- [x] Zero TypeScript errors
- [x] All tests passing
- [x] Update API.md if any endpoint contract was refined during implementation