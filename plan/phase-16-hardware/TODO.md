# Phase 16 — Hardware Integration TODO
> ⚠️ **STRICT i18n & LOCALIZATION WARNING FOR AI/DEVELOPERS:**
> - **ALL UI text MUST use `useT()` / `t()` with complete translation keys.** No hardcoded user-facing strings are allowed anywhere.
> - **ALL backend errors/messages MUST use `apps/backend/src/lib/errors.ts` with localized messages.** No hardcoded English strings in route handlers or services.
> - Missing or incomplete translations will be treated as a blocking bug.


## HAL Interfaces

- [ ] Implement `IReceiptPrinter` interface (`packages/infrastructure/hardware/src/interfaces/receipt-printer.interface.ts`): `print(template: ReceiptTemplate): Promise<PrintResult>`, `testPrint(): Promise<PrintResult>`, `getStatus(): Promise<PrinterStatus>`; define PrintResult, PrinterStatus types
- [ ] Implement `IBarcodeScanner` interface: `startScan(options): void`, `stopScan(): void`, `onScanResult(callback): Unsubscribe`; define ScanResult type
- [ ] Implement `ICashDrawer` interface: `open(): Promise<DrawerResult>`, `getStatus(): Promise<DrawerStatus>`
- [ ] Implement `IScale` interface: `readWeight(): Promise<WeightReading>`, `tare(): Promise<void>`; define WeightReading (value: number, unit: string)

## No-Op Adapters (CI / Dev)

- [ ] `NoopPrinterAdapter`: `print()` logs template to console and returns {success: true}; `getStatus()` returns {connected: false, isNoop: true}
- [ ] `NoopBarcodeScannerAdapter`: `startScan()` calls onScanResult with configured test barcode after 100ms; `stopScan()` is a no-op
- [ ] `NoopCashDrawerAdapter`: `open()` returns {success: true}; `getStatus()` returns {connected: false}
- [ ] `NoopScaleAdapter`: `readWeight()` returns {value: 0, unit: 'kg'}; `tare()` is a no-op

## Desktop Adapters (Tauri)

- [ ] `TauriEscPosPrinterAdapter`: invoke Tauri command `print_receipt` with ESC/POS byte array; handle PrinterNotReachableError, PaperOutError; both map to graceful fallback trigger
- [ ] `TauriHidBarcodeScannerAdapter`: use Tauri global keyboard shortcut listener on barcode-prefix + suffix characters; parse scan string from HID wedge keystroke sequence; emit onScanResult
- [ ] `TauriCashDrawerAdapter`: invoke Tauri command `open_cash_drawer` via serial port; handle DrawerNotConnectedError gracefully (log only, no cashier-visible error)
- [ ] `TauriUsbScaleAdapter`: invoke Tauri command `read_scale_weight`; handle ScaleNotConnectedError (return null weight, show manual-entry prompt)

## Android Adapters (Capacitor)

- [ ] `CapacitorCameraBarcodeScannerAdapter`: use @capacitor-community/barcode-scanner; request camera permission; start/stop camera scan; emit onScanResult with scanned value
- [ ] `CapacitorBluetoothPrinterAdapter`: use @capacitor-community/bluetooth-le; pair and send ESC/POS byte array; handle BluetoothNotAvailableError gracefully
- [ ] `CapacitorUsbSerialAdapter` (for printer, cash drawer, scale on Android): use USB serial Capacitor plugin; handle UsbNotGrantedError gracefully
- [ ] Zero Kotlin/Java code: all Android adapters are TypeScript/Capacitor plugin calls only — verified by CI check

## Graceful Fallback Logic

- [ ] Define fallback behavior per failure type in HAL dispatcher:
  - PrinterNotAvailable → trigger DigitalReceiptModal display
  - CashDrawerNotConnected → log audit entry, do not block sale
  - ScannerNotConnected → show manual barcode entry input
  - ScaleNotConnected → show manual weight entry input
- [ ] Implement `DigitalReceiptModal.tsx`: full receipt rendered as styled component; copy-to-clipboard, offer SMS/email send, print-to-PDF

## Arabic RTL Receipt Template

- [ ] Implement `ArabicRtlReceiptTemplate` (`packages/infrastructure/hardware/src/templates/arabic-rtl-receipt.template.ts`): ESC/POS byte sequence for RTL text, Arabic product names, Arabic numerals for totals, company name in Arabic, date in Egyptian format, tax registration number
- [ ] Test template with sample Arabic strings including mixed-direction text (Arabic product names + numeric prices)

## Adapter Contract Tests

- [ ] `printer-contract.test.ts`: test against NoopPrinterAdapter; simulate PrinterNotAvailableError → verify DigitalReceiptModal triggered
- [ ] `scanner-contract.test.ts`: simulate scan sequence → verify onScanResult fires with correct barcode string; simulate ScannerNotConnected → verify fallback input shown
- [ ] `cash-drawer-contract.test.ts`: simulate DrawerNotConnected → verify sale completes and audit entry logged
- [ ] `scale-contract.test.ts`: simulate ScaleNotConnected → verify manual-entry prompt shown

## DI Registration

- [ ] Desktop DI container: registers Tauri adapters when running in Tauri environment; registers Noop adapters in test/CI environment
- [ ] Android DI container: registers Capacitor adapters when running in Capacitor environment; registers Noop adapters in test/CI environment
- [ ] Environment detection: single `isCapacitorRuntime()` / `isTauriRuntime()` utility used in both DI containers

## Tests

- [ ] See TESTS.md

### Quality Gates

- [ ] Zero TypeScript errors
- [ ] All tests passing
- [ ] Update API.md if any endpoint contract was refined during implementation