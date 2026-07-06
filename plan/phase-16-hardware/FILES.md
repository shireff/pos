# Phase 16 — Hardware Integration Files

## Domain / Application Interfaces

```
packages/domain/sales/src/domain-services/receipt-printer.interface.ts
packages/domain/sales/src/domain-services/barcode-scanner.interface.ts
packages/domain/sales/src/domain-services/cash-drawer.interface.ts
packages/domain/sales/src/domain-services/scale.interface.ts
```

## Infrastructure — Hardware Adapters

```
packages/infrastructure/hardware/printer/escpos-printer.adapter.ts
packages/infrastructure/hardware/printer/escpos-printer.adapter.test.ts
packages/infrastructure/hardware/printer/digital-receipt.adapter.ts
packages/infrastructure/hardware/printer/receipt-template.ts
packages/infrastructure/hardware/printer/arabic-codepage.ts
packages/infrastructure/hardware/printer/noop-printer.adapter.ts

packages/infrastructure/hardware/scanner/hid-wedge-scanner.adapter.ts
packages/infrastructure/hardware/scanner/hid-wedge-scanner.adapter.test.ts
packages/infrastructure/hardware/scanner/capacitor-barcode-scanner.adapter.ts
packages/infrastructure/hardware/scanner/noop-scanner.adapter.ts

packages/infrastructure/hardware/drawer/printer-rj11-drawer.adapter.ts
packages/infrastructure/hardware/drawer/printer-rj11-drawer.adapter.test.ts
packages/infrastructure/hardware/drawer/standalone-serial-drawer.adapter.ts
packages/infrastructure/hardware/drawer/noop-drawer.adapter.ts

packages/infrastructure/hardware/scale/bluetooth-scale.adapter.ts
packages/infrastructure/hardware/scale/bluetooth-scale.adapter.test.ts
packages/infrastructure/hardware/scale/serial-scale.adapter.ts
packages/infrastructure/hardware/scale/noop-scale.adapter.ts
```

## UI Components

```
packages/ui-components/src/hardware/HardwareStatusBadge.tsx
packages/ui-components/src/hardware/PrinterFallbackMessage.tsx
packages/ui-components/src/hardware/ScaleWeightDisplay.tsx
packages/ui-components/src/hardware/BarcodeScanOverlay.tsx
packages/ui-components/src/hardware/DrawerManualOpenPrompt.tsx
```

## Desktop Settings

```
apps/desktop/src/features/settings/HardwareSettingsPage.tsx
apps/desktop/src/bootstrap/hardware-di.ts
```

## Android Capacitor Bridges

```
apps/android/src/bootstrap/barcode-scanner-bridge.ts
apps/android/src/bootstrap/bluetooth-bridge.ts
apps/android/src/features/settings/HardwareSettingsPage.tsx
```
