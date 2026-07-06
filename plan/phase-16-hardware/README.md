# Phase 16 — Hardware Integration

## Purpose

Hardware Abstraction Layer (HAL) — receipt printer (ESC/POS), barcode scanner (HID wedge and camera), cash drawer, and scale. Every peripheral has a defined graceful fallback behavior so a hardware failure never surfaces a raw technical error to the cashier. Desktop adapters use Tauri plugins; Android adapters use Capacitor plugins. Zero Kotlin/Java code is allowed in the Android layer.

## Scope

- **HAL Interfaces**: ReceiptPrinter interface (print, testPrint, getStatus), BarcodeScanner interface (startScan, stopScan, onScanResult), CashDrawer interface (open, getStatus), Scale interface (readWeight, tare)
- **Desktop Adapters (Tauri)**: TauriEscPosPrinterAdapter (Tauri plugin for USB/serial ESC/POS), TauriHidBarcodeScannerAdapter (keyboard wedge via Tauri global shortcut listener), TauriCashDrawerAdapter (serial pulse via Tauri plugin), TauriUsbScaleAdapter
- **Android Adapters (Capacitor)**: CapacitorCameraBarcodeScannerAdapter (@capacitor-community/barcode-scanner), CapacitorBluetoothPrinterAdapter (@capacitor-community/bluetooth-le), CapacitorUsbSerialAdapter (USB serial Capacitor plugin for printer/drawer/scale)
- **Simulated No-op Adapters**: NoopPrinterAdapter (logs to console, returns success), NoopBarcodeScannerAdapter (returns configured test barcode string), NoopCashDrawerAdapter, NoopScaleAdapter — used in CI and dev environments
- **Arabic RTL Receipt Template**: ESC/POS template rendering Arabic product names and totals right-to-left; tested with sample Arabic string rendering
- **Digital Receipt Fallback**: when printer is unavailable, generates a digital receipt (PDF or in-app display) and offers to send via SMS/email
- **Adapter Contract Tests**: each HAL interface has a contract test suite that runs against the No-op adapter in CI — simulates connection failure, print failure, scan timeout, and scale read error; verifies graceful fallback behavior for all failure modes

## Expected Output

A working HAL where:

- All four peripheral types work end-to-end on Desktop (Tauri) and Android (Capacitor)
- Every simulated hardware failure produces the defined fallback behavior — never a raw error to cashier
- Arabic RTL receipt renders correctly
- Digital receipt fallback fires when printer is unavailable
- All adapter contract tests pass in CI without physical hardware
- Zero Kotlin/Java UI code in the Android integration

## Documents Referenced

- Hardware.md (all sections)
- Business_Rules.md §15
- Error_Catalog.md §9

## Included Modules

- `packages/infrastructure/hardware/src/interfaces/receipt-printer.interface.ts`
- `packages/infrastructure/hardware/src/interfaces/barcode-scanner.interface.ts`
- `packages/infrastructure/hardware/src/interfaces/cash-drawer.interface.ts`
- `packages/infrastructure/hardware/src/interfaces/scale.interface.ts`
- `packages/infrastructure/hardware/src/adapters/desktop/*` (4 Tauri adapters)
- `packages/infrastructure/hardware/src/adapters/android/*` (4 Capacitor adapters)
- `packages/infrastructure/hardware/src/adapters/noop/*` (4 no-op adapters)
- `packages/infrastructure/hardware/src/templates/arabic-rtl-receipt.template.ts`
- `packages/infrastructure/hardware/src/templates/digital-receipt.template.ts`
- `packages/ui-components/src/receipts/DigitalReceiptModal.tsx`
