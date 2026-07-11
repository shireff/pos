import {
  TauriReceiptPrinter,
  SimulatedReceiptPrinter,
  TauriCashDrawer,
  SimulatedCashDrawer,
  CapacitorCameraBarcodeScanner,
} from '@packages/infrastructure-hardware';
import type { ReceiptPrinter, CashDrawer, BarcodeScanner } from '@packages/application-sales';

function isNativeShell(): boolean {
  // Capacitor injects window.Capacitor; Tauri injects window.__TAURI__.
  return typeof window !== 'undefined' && ('Capacitor' in (window as unknown as Record<string, unknown>) || '__TAURI__' in (window as unknown as Record<string, unknown>));
}

/**
 * Composition root for POS hardware adapters on the Android (Capacitor) shell
 * (Architecture.md §8 / Hardware.md §1). Swapping a peripheral is done here.
 *
 * - Receipt printing uses the Tauri adapter when running in the desktop shell,
 *   otherwise the simulated adapter (the digital-receipt fallback is shown).
 * - The camera barcode scanner uses the Capacitor community plugin and is only
 *   instantiated when a real scan is requested (lazy, optional dependency).
 */
export function getReceiptPrinter(): ReceiptPrinter {
  return isNativeShell() && '__TAURI__' in (window as unknown as Record<string, unknown>)
    ? new TauriReceiptPrinter()
    : new SimulatedReceiptPrinter();
}

export function getCashDrawer(): CashDrawer {
  return isNativeShell() && '__TAURI__' in (window as unknown as Record<string, unknown>)
    ? new TauriCashDrawer()
    : new SimulatedCashDrawer();
}

export function createCameraBarcodeScanner(): BarcodeScanner {
  return new CapacitorCameraBarcodeScanner();
}
