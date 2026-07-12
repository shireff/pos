import type { BarcodeScanner, Unsubscribe, ScanResult, ScanOptions } from '@packages/application-sales';

/**
 * SimulatedBarcodeScanner is the no-op / test double used in CI and dev. On
 * startScan() it emits a configured test barcode after 100ms (Hardware.md §3),
 * so the cart/lookup flow can be exercised without a physical scanner. stopScan
 * cancels the pending emission. Never blocks the sale.
 */
export class SimulatedBarcodeScanner implements BarcodeScanner {
  private callback: ((result: ScanResult) => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private testBarcode: string;

  public constructor(testBarcode = '123456789') {
    this.testBarcode = testBarcode;
  }

  public startScan(_options: ScanOptions = {}): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.callback?.({ code: this.testBarcode, timestamp: Date.now() });
    }, 100);
  }

  public stopScan(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public onScanResult(callback: (result: ScanResult) => void): Unsubscribe {
    this.callback = callback;
    return () => {
      if (this.callback === callback) this.callback = null;
    };
  }
}
