import {
  PrinterNotAvailableError,
  DrawerOpenError,
  DrawerNotConnectedError,
  ScaleNotConnectedError,
  ScannerNotConnectedError,
  BluetoothNotAvailableError,
  UsbNotGrantedError,
} from './errors';

/**
 * Graceful-fallback policy for every hardware failure type (Hardware.md §1, §2,
 * §3, §4, §5). The rule is absolute: NO hardware failure ever blocks a sale and
 * NO raw technical error is surfaced to the cashier (BR-HW-001). Each resolver
 * returns a structured decision the UI can act on, and the few that require an
 * audit trail receive an AuditSink.
 */

export interface AuditEntry {
  event: string;
  meta?: unknown;
}

export interface AuditSink {
  log(entry: AuditEntry): void;
}

export type PrintFallback = { kind: 'digital-receipt' };
export type DrawerFallback = { kind: 'manual-open'; logAudit: true };
export type ScannerFallback = { kind: 'manual-entry' };
export type ScaleFallback = { kind: 'manual-entry' };

/** Any printer error → show the digital receipt instead of blocking. */
export function resolvePrintFallback(_err: unknown): PrintFallback {
  return { kind: 'digital-receipt' };
}

/** Drawer failure → log an audit entry, prompt manual open, never block sale. */
export function resolveDrawerFallback(err: unknown, audit?: AuditSink): DrawerFallback {
  audit?.log({
    event: 'CASH_DRAWER_OPEN_FAILED',
    meta: {
      error: err instanceof Error ? err.name : 'unknown',
      message: err instanceof Error ? err.message : String(err),
    },
  });
  return { kind: 'manual-open', logAudit: true };
}

/** Scanner failure → keep the manual barcode entry field visible. */
export function resolveScannerFallback(_err: unknown): ScannerFallback {
  return { kind: 'manual-entry' };
}

/** Scale failure → show manual weight entry, sale not blocked. */
export function resolveScaleFallback(_err: unknown): ScaleFallback {
  return { kind: 'manual-entry' };
}

/** True for any error that should route the cashier to a digital receipt. */
export function isPrinterError(err: unknown): err is PrinterNotAvailableError {
  return err instanceof PrinterNotAvailableError;
}

/** True for a drawer error that must be logged but must not block the sale. */
export function isDrawerError(err: unknown): err is DrawerOpenError {
  return err instanceof DrawerOpenError;
}

/** True for a disconnected-scale condition that yields a manual-entry prompt. */
export function isScaleDisconnected(err: unknown): err is ScaleNotConnectedError {
  return err instanceof ScaleNotConnectedError;
}

/** True for a scanner condition that yields a manual-entry prompt. */
export function isScannerDisconnected(err: unknown): err is ScannerNotConnectedError {
  return err instanceof ScannerNotConnectedError;
}

/** True when the failure is a permission/availability issue for Bluetooth/USB. */
export function isWirelessUnavailable(
  err: unknown,
): err is BluetoothNotAvailableError | UsbNotGrantedError {
  return err instanceof BluetoothNotAvailableError || err instanceof UsbNotGrantedError;
}

export { DrawerNotConnectedError };
