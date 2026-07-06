# Phase 16 — Hardware Integration Tests

## Adapter Contract Tests (all run in CI with simulated I/O — no physical hardware)

### hardware/printer.contract.test.ts

- Printer available: print(receipt) → PrintResult.success, correct ESC/POS bytes generated
- Printer paper out: print(receipt) → PrintResult.failure, sale NOT blocked, digital receipt returned
- Printer disconnected: isAvailable() → false, sale NOT blocked, fallback triggered
- Arabic text in receipt: correct code-page switching commands included
- Digital receipt fallback contains all required fields (order items, totals, tax, company info)
- RTL layout applied to receipt template when language = Arabic

### hardware/scanner.contract.test.ts

- HID wedge input: rapid keystrokes + Enter → decoded as barcode string
- Camera scanner (Capacitor plugin): scan result emitted as same string format as HID wedge
- Misread (short input): scanner adapter emits SCANNER_MISREAD; manual entry field always present
- Scanner disconnected: manual entry field always visible (never hidden based on scanner presence)

### hardware/drawer.contract.test.ts

- Cash sale: cash drawer open command sent via printer RJ11 pulse
- Drawer open failure: sale still completes, manual-open prompt shown to cashier
- Manager no-sale open: permission-gated, always logged in audit_entries
- Standalone USB serial drawer: same CashDrawer interface, different adapter

### hardware/scale.contract.test.ts

- Stable weight reading: WeightReading { grams: 500, isStable: true } → accepted by POS UI
- Unstable weight: WeightReading { isStable: false } → rejected; POS waits for stable
- Scale disconnected: manual weight entry field available; sale not blocked
- Scale reading accepted only when isStable = true (BR-HW-004)

## Cross-Platform Policy Tests

- Android barcode scanner uses @capacitor-community/barcode-scanner (no Kotlin/Java code)
- Android Bluetooth uses @capacitor-community/bluetooth-le (no native Java Bluetooth code)
- No `import` from native Android modules exists anywhere in `apps/android/src/`

## E2E Tests

- Scan barcode on Desktop with USB scanner → product loads in cart <100ms
- Scan barcode on Android with camera → product loads in cart
- Complete cash sale → cash drawer opens
- Printer offline → digital receipt shown → next sale works normally
