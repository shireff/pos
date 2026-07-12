import {
  TauriReceiptPrinter,
  SimulatedReceiptPrinter,
  TauriCashDrawer,
  SimulatedCashDrawer,
  TauriUsbScaleAdapter,
  SimulatedScale,
  HidBarcodeScanner,
  isTauriRuntime,
  isTestOrCiRuntime,
} from '@packages/infrastructure-hardware';
import type { ReceiptPrinter, CashDrawer, Scale, BarcodeScanner } from '@packages/application-sales';

/**
 * Composition root for POS hardware adapters on the Desktop (Tauri) shell
 * (Architecture.md §8 / Hardware.md §1). Swapping a printer brand or scanner
 * type is done here — never in feature code.
 *
 * Selection policy:
 *   - CI / test runtime  → simulated (no-op) adapters so the build needs no peripherals.
 *   - Tauri runtime       → real Tauri adapters (USB/serial ESC/POS, HID wedge).
 *   - otherwise           → simulated adapters (back-office without peripherals).
 */
function useRealAdapters(): boolean {
  return isTauriRuntime() && !isTestOrCiRuntime();
}

export function getReceiptPrinter(): ReceiptPrinter {
  return useRealAdapters() ? new TauriReceiptPrinter() : new SimulatedReceiptPrinter();
}

export function getCashDrawer(): CashDrawer {
  return useRealAdapters() ? new TauriCashDrawer() : new SimulatedCashDrawer();
}

export function getScale(): Scale {
  return useRealAdapters() ? new TauriUsbScaleAdapter() : new SimulatedScale();
}

/** Desktop scanners are HID keyboard-wedge devices bound to a focused input. */
export function createHidBarcodeScanner(input: HTMLInputElement): BarcodeScanner {
  return new HidBarcodeScanner(input);
}
