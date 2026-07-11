import {
  TauriReceiptPrinter,
  SimulatedReceiptPrinter,
  TauriCashDrawer,
  SimulatedCashDrawer,
} from '@packages/infrastructure-hardware';
import type { ReceiptPrinter, CashDrawer } from '@packages/application-sales';

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in (window as unknown as Record<string, unknown>);
}

/**
 * Composition root for POS hardware adapters (Architecture.md §8 / Hardware.md §1).
 * Swapping a printer brand or scanner type is done here — never in feature code.
 *
 * Desktop runs inside Tauri; when not (e.g. a back-office instance with no
 * attached peripherals) the simulated adapters are selected so the UI still
 * functions and the digital-receipt fallback is exercised.
 */
export function getReceiptPrinter(): ReceiptPrinter {
  return isTauri() ? new TauriReceiptPrinter() : new SimulatedReceiptPrinter();
}

export function getCashDrawer(): CashDrawer {
  return isTauri() ? new TauriCashDrawer() : new SimulatedCashDrawer();
}
