# Phase 16 — Hardware Integration Dependencies

## Incoming

- Phase 01, 02 (Foundation, Auth) — infrastructure layer scaffold needed
- Phase 03 (Products) — barcode scanner lookups reference product barcodes

## Outgoing

- Phase 07 (Sales) — POS requires receipt printer, barcode scanner, cash drawer; Phase 16 should complete before Phase 07 exit gate (or run concurrently with hardware stubs)

## Documents Used

- Hardware.md (ALL sections — primary document, especially §0 Cross-Platform Policy)
- Architecture.md §5 (infrastructure layer owns hardware adapters)
- Business_Rules.md §15 (BR-HW-001 through BR-HW-006)
- Error_Catalog.md §9 (PRINTER_UNAVAILABLE, SCANNER_MISREAD, DRAWER_OPEN_FAILED, SCALE_UNSTABLE_OR_DISCONNECTED)
- Testing.md §7 (adapter contract tests with simulated I/O)
- UI_UX.md §5 (error and fallback messages — no raw technical errors to cashier)

## Critical Rules

- Desktop: Tauri plugins first → custom Tauri commands → document limitation if neither works
- Android: @capacitor/* plugins first → @capacitor-community/* → document limitation if neither works
- ZERO Kotlin/Java UI code in Android hardware adapters
- Every peripheral has a noop/simulated adapter for CI (no physical hardware required in CI)
- No sale is EVER blocked by hardware failure (BR-HW-001)

## Shared Modules Produced

- `packages/domain/sales/src/domain-services/*` interfaces (consumed by Sales domain)
- `packages/infrastructure/hardware/*` adapters (consumed by Desktop and Android bootstrap)
- Simulated adapters reused in all hardware-touching tests
