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

/** Thrown when a cash drawer fails to open. Non-blocking: the sale still completes. */
export class DrawerOpenError extends Error {
  public readonly cause?: unknown;

  public constructor(message = 'Cash drawer failed to open', cause?: unknown) {
    super(message);
    this.name = 'DrawerOpenError';
    this.cause = cause;
  }
}
