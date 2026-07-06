# Hardware.md — Smart Retail OS Hardware Integration Layer

**Depends on:** Architecture.md §2, §5 (`packages/infrastructure/hardware`)
**Feeds into:** UI_UX.md §2.1 (POS Register), Implementation_Pipeline.md Step 2.3
**Governing rule:** No POS-critical flow (completing a sale, opening the drawer) may ever hard-depend on a peripheral being present or functional — every hardware interaction has a software fallback, per Vision.md's "no business operation blocked" principle.

## 0. Cross-Platform Hardware Access Policy

All hardware access follows a strict preference order to maximize shared code and minimize platform-specific maintenance:

### Desktop (Tauri)

1. **Tauri plugins first** — use an official or community `tauri-plugin-*` plugin if one exists for the required capability.
2. **Custom Tauri commands (Rust)** — write a Tauri command in the `src-tauri/src/` layer only if no suitable plugin exists.
3. **Document limitation** — if a peripheral absolutely cannot be supported through Tauri's plugin or command model, document the limitation explicitly in this file and provide the best available cross-platform alternative. Do not implement native OS integrations that bypass Tauri's security model.

### Android (Capacitor)

1. **Official Capacitor plugins first** — use `@capacitor/*` official plugins whenever available.
2. **Community Capacitor plugins second** — use well-maintained community plugins (e.g., `@capacitor-community/*`) if no official plugin covers the requirement.
3. **Never write Kotlin/Java UI code** — the Android project folder (`apps/android/android/`) is Capacitor-generated and contains no manually authored native UI. If a peripheral absolutely requires native code, document the limitation here and provide the best cross-platform alternative.
4. **Document limitation** — if a capability is impossible via any Capacitor plugin (official or community), document it explicitly rather than implementing native-only code.

This policy is the enforcement mechanism for Architecture.md's 95% shared-code target: deviating from it (e.g., writing Android-specific UI) breaks the sharing guarantee and must be flagged as a documentation-drift bug.

## 1. Hardware Abstraction Layer (HAL)

- All peripheral interaction goes through interfaces defined in `domain`/`application`, implemented in `packages/infrastructure/hardware` — identical pattern to the AI Provider abstraction (AI.md §1) and Sync transport abstraction (Sync Architecture.md): **no feature code calls a device driver/SDK directly.**

```
interface ReceiptPrinter {
  print(receipt: ReceiptPayload): Promise<PrintResult>
  isAvailable(): Promise<boolean>
}
interface BarcodeScanner {
  onScan(handler: (code: string) => void): Unsubscribe
}
interface CashDrawer {
  open(): Promise<DrawerResult>
}
interface Scale {
  readWeight(): Promise<WeightReading>
}
```

- Each interface has at minimum: a **real adapter** (per platform) and a **simulated/no-op adapter** used in tests (Implementation_Pipeline.md Step 2.3 adapter contract tests) and in environments with no physical hardware attached (e.g., a back-office Desktop instance that never prints receipts).
- Adapter selection happens at each app's composition root (`bootstrap/`, Architecture.md §8) via DI — swapping a printer brand or scanner type never touches use-case code.

## 2. Printer (Receipts)

- **Protocol:** ESC/POS over USB, Bluetooth, or network (IP) printers — the three connection types a small Egyptian retail shop commonly has.
- **Receipt template:** defined once (shared logical template — line items, totals, tax breakdown, footer with company info/ETA reference when applicable), rendered to ESC/POS command bytes by the printer adapter; the _same_ logical template renders to a PDF/on-screen digital receipt when no printer is available or configured.
- **Fallback behavior:** if `isAvailable()` returns false or `print()` fails (paper out, disconnected, driver error), the sale still completes — the cashier is shown the digital-receipt fallback (screen display + optional SMS/WhatsApp share when that channel exists, per Notifications.md §2) rather than the transaction being blocked or the error being swallowed silently.
- **RTL/Arabic printing:** receipt template respects Design System.md typography and RTL rules; ESC/POS code-page selection is handled per printer capability (many thermal printers require explicit Arabic code-page switching commands) — the adapter is responsible for this, not the domain layer, which only ever produces a language-agnostic `ReceiptPayload`.

## 3. Barcode Scanner

- **Desktop:** scanners operate in **keyboard-wedge (HID) mode** by default — no special driver needed; the scanner behaves as rapid keyboard input terminated by an Enter/Tab character. The barcode input field on POS Register (UI_UX.md §2.1) is always focused by default specifically to catch this input stream without requiring a cashier click.
- **Android:** two supported modes — (1) external Bluetooth/USB-OTG HID scanner, same wedge behavior as Desktop; (2) built-in camera-based scanning via **`@capacitor-community/barcode-scanner`** or **`@capacitor/camera`** — not a native camera implementation. The Capacitor plugin handles camera access and on-device barcode decoding; no Kotlin/Java camera code is written. This exposes an in-app scan button/overlay for shops without dedicated scanner hardware.
- **Format support:** EAN-13, EAN-8, UPC-A, Code128, QR (QR reserved for potential future use — e.g., digital loyalty cards — not required for product barcodes in v1).
- **Validation:** checksum validation and duplicate-barcode warning happen at the UI/application layer per UI_UX.md §4, independent of which physical scan method produced the input — the scanner adapter's only job is to emit a raw decoded string.

## 4. Cash Drawer

- **Connection:** typically driven via the receipt printer's RJ11 port (`printer.openDrawer()` pulse command) rather than a separate USB drawer controller — the common low-cost setup for Egyptian retail hardware. A standalone USB/serial drawer controller is supported as a second adapter implementation behind the same `CashDrawer` interface.
- **Triggers:** drawer open is triggered by (a) completing a cash-tender sale, (b) an explicit manager "no-sale open" action (permission-gated, always logged — see Security.md §5 audited actions, since a drawer-open-without-sale event is also a fraud-detection signal per AI.md §4).
- **Failure handling:** a drawer that fails to open (jammed, disconnected) never blocks sale completion — the transaction is already recorded; the cashier is shown a "please open drawer manually" prompt instead.

## 5. Scale (Weighted Products)

- Relevant primarily to grocery/deli-style shops selling by weight (Vision.md §6 Priority 1 vertical).
- **Connection:** Bluetooth or serial/COM scales — adapter reads a `WeightReading { grams, isStable }`; the POS UI only accepts the reading once `isStable = true`, to avoid capturing an in-motion weight.
- **Fallback:** manual weight entry field always available alongside the scale-read flow — a shop without a connected scale, or a temporarily disconnected one, is never blocked from completing a weighted-item sale.

## 6. Connectivity Types Supported

| Type                      | Peripherals                                                                  | Cross-Platform Access Method                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| USB                       | Printer, barcode scanner, cash drawer (via printer or standalone controller) | Desktop: Tauri plugin or Tauri command (Rust); Android: `@capacitor-community/usb-serial` or equivalent Capacitor plugin                       |
| Bluetooth                 | Printer, barcode scanner, scale                                              | Desktop: Tauri plugin (`tauri-plugin-*`); Android: `@capacitor-community/bluetooth-le` or equivalent Capacitor plugin                          |
| Network (IP)              | Printer (shared network printer setups in larger stores)                     | Both platforms: standard HTTP/TCP via shared TypeScript code in `packages/infrastructure/hardware/`                                            |
| Serial/COM                | Scale, legacy printers                                                       | Desktop: Tauri plugin or Tauri command (Rust serial binding); Android: Capacitor plugin if available, else document as Desktop-only limitation |
| Camera (Android built-in) | Barcode scanning without external hardware                                   | Android: `@capacitor-community/barcode-scanner` or `@capacitor/camera` — never native Kotlin/Java                                              |

Adapter discovery/pairing UI lives in **Settings → Hardware** (an extension of Device Management, UI_UX.md §2.6), listing detected peripherals per connectivity type and letting the user assign a role (e.g., "this Bluetooth device is the receipt printer") — configuration is per-device (Desktop instance / Android instance), not per-company, since physical peripherals are attached to a specific machine.

## 7. Adapter Contract Tests

- Per Implementation_Pipeline.md Step 2.3, every adapter (printer, scanner, drawer, scale) has contract tests run against a **simulated I/O double**, not physical hardware, so CI can verify adapter behavior (correct command bytes generated, correct fallback triggered on simulated failure) without requiring physical devices in the build pipeline.
- A manual hardware test checklist (physical printer/scanner/drawer/scale models actually available to the founder) supplements automated contract tests before each hardware-touching release, tracked in project management tooling rather than this document (per Implementation_Pipeline.md §4 — this file documents "how it should behave," not day-to-day test tracking).

## 8. Error Handling & Fallback Behavior Summary

| Peripheral | Failure Mode                     | Fallback                                            |
| ---------- | -------------------------------- | --------------------------------------------------- |
| Printer    | Offline, paper out, driver error | Digital receipt (screen + optional message share)   |
| Scanner    | Disconnected, misread            | Manual barcode/SKU entry field always present       |
| Drawer     | Jammed, disconnected             | Manual-open prompt to cashier; sale still completes |
| Scale      | Disconnected, unstable reading   | Manual weight entry field                           |

No peripheral failure ever produces a raw technical error to the cashier — mapped to plain-language guidance per UI_UX.md §5, consistent with how network/sync errors are handled.

## 9. Future Roadmap

Payment terminal deep integration (card/wallet terminals talking directly to the POS rather than manual amount entry) is deferred to Phase 3 (Vision.md §8) — the `payments` table (Database.md §2.10) already carries a `provider_reference` field so this integration, when built, extends rather than restructures the existing Sales domain.

---

_Hardware.md — every adapter here implements an interface owned by `domain`/`application`; infrastructure is the only layer allowed to know a specific printer brand or scanner protocol exists (Architecture.md §2 dependency rule)._
