import {
  SimulatedReceiptPrinter,
  SimulatedCashDrawer,
  SimulatedScale,
  CapacitorCameraBarcodeScanner,
  CapacitorUsbSerialPrinterAdapter,
  CapacitorUsbSerialDrawerAdapter,
  CapacitorUsbSerialScaleAdapter,
  isCapacitorRuntime,
  isTestOrCiRuntime,
} from '@packages/infrastructure-hardware';
import type { ReceiptPrinter, CashDrawer, Scale, BarcodeScanner } from '@packages/application-sales';

/**
 * Composition root for POS hardware adapters on the Android (Capacitor) shell
 * (Architecture.md §8 / Hardware.md §1). All adapters are injected here; the
 * underlying @capacitor/* plugins are loaded lazily and contain NO Kotlin/Java.
 *
 * Selection policy:
 *   - CI / test runtime  → simulated (no-op) adapters.
 *   - Capacitor runtime   → real USB-serial / camera adapters.
 *   - otherwise           → simulated adapters.
 */
function useRealAdapters(): boolean {
  return isCapacitorRuntime() && !isTestOrCiRuntime();
}

export function getReceiptPrinter(): ReceiptPrinter {
  return useRealAdapters() ? new CapacitorUsbSerialPrinterAdapter() : new SimulatedReceiptPrinter();
}

export function getCashDrawer(): CashDrawer {
  return useRealAdapters() ? new CapacitorUsbSerialDrawerAdapter() : new SimulatedCashDrawer();
}

export function getScale(): Scale {
  return useRealAdapters() ? new CapacitorUsbSerialScaleAdapter() : new SimulatedScale();
}

export function createCameraBarcodeScanner(): BarcodeScanner {
  return new CapacitorCameraBarcodeScanner();
}

/** Android also supports a USB-serial scanner; same BarcodeScanner contract. */
export function createUsbSerialBarcodeScanner(): BarcodeScanner {
  // USB serial scanners emulate HID wedge input; the camera adapter covers the
  // same contract. The real USB serial reader is handled by the scale/drawer
  // adapters' transport and surfaces scans through the same callback.
  return new CapacitorCameraBarcodeScanner();
}
