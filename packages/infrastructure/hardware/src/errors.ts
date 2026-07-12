/**
 * Thrown when a receipt printer is unavailable or rejects a print job.
 * Callers MUST fall back to a digital receipt rather than blocking the sale.
 */
export class PrinterNotAvailableError extends Error {
  public readonly cause?: unknown;

  public constructor(message = 'Receipt printer is not available', cause?: unknown) {
    super(message);
    this.name = 'PrinterNotAvailableError';
    this.cause = cause;
  }
}

/** Printer is reachable on the bus but not responding (Hardware.md §2). */
export class PrinterNotReachableError extends PrinterNotAvailableError {
  public constructor(message = 'Receipt printer is not reachable', cause?: unknown) {
    super(message, cause);
    this.name = 'PrinterNotReachableError';
  }
}

/** Printer reports end-of-paper; the sale still completes (Hardware.md §2). */
export class PaperOutError extends PrinterNotAvailableError {
  public constructor(message = 'Receipt printer is out of paper', cause?: unknown) {
    super(message, cause);
    this.name = 'PaperOutError';
  }
}

/** Thrown when a cash drawer fails to open. Non-blocking: the sale still completes. */
export class DrawerOpenError extends Error {
  public readonly cause?: unknown;

  public constructor(message = 'Cash drawer failed to open', cause?: unknown) {
    super(message);
    this.name = 'DrawerOpenError';
    this.cause = cause;
  }
}

/** Drawer is not physically connected; log + prompt manual open, never block sale. */
export class DrawerNotConnectedError extends DrawerOpenError {
  public constructor(message = 'Cash drawer is not connected', cause?: unknown) {
    super(message, cause);
    this.name = 'DrawerNotConnectedError';
  }
}

/** Scale is disconnected; caller shows manual weight entry (Hardware.md §5). */
export class ScaleNotConnectedError extends Error {
  public readonly cause?: unknown;

  public constructor(message = 'Scale is not connected', cause?: unknown) {
    super(message);
    this.name = 'ScaleNotConnectedError';
    this.cause = cause;
  }
}

/** Bluetooth stack is unavailable on the device; caller falls back gracefully. */
export class BluetoothNotAvailableError extends Error {
  public readonly cause?: unknown;

  public constructor(message = 'Bluetooth is not available', cause?: unknown) {
    super(message);
    this.name = 'BluetoothNotAvailableError';
    this.cause = cause;
  }
}

/** USB serial permission was not granted; caller falls back gracefully. */
export class UsbNotGrantedError extends Error {
  public readonly cause?: unknown;

  public constructor(message = 'USB serial permission not granted', cause?: unknown) {
    super(message);
    this.name = 'UsbNotGrantedError';
    this.cause = cause;
  }
}

/** Scanner is not connected/ready; caller shows the manual barcode entry field. */
export class ScannerNotConnectedError extends Error {
  public readonly cause?: unknown;

  public constructor(message = 'Barcode scanner is not connected', cause?: unknown) {
    super(message);
    this.name = 'ScannerNotConnectedError';
    this.cause = cause;
  }
}

/** A scan was too short / malformed to trust; caller re-prompts, never blocks. */
export class ScannerMisreadError extends Error {
  public readonly raw: string;

  public constructor(raw: string, message = 'Barcode scan misread') {
    super(message);
    this.name = 'ScannerMisreadError';
    this.raw = raw;
  }
}
