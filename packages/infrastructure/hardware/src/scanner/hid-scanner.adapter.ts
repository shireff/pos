import type { BarcodeScanner, Unsubscribe, ScanResult, ScanOptions } from '@packages/application-sales';

/**
 * HidBarcodeScanner adapts a keyboard-wedge (HID) scanner. A HID scanner behaves
 * as rapid keyboard input into a focused text field terminated by Enter. The POS
 * barcode input is kept always-focused specifically to catch this stream
 * (Hardware.md §3). This adapter attaches on startScan(), decodes the buffered
 * string on the suffix key, and emits a ScanResult. It performs no validation
 * (that lives in the application layer).
 */
export class HidBarcodeScanner implements BarcodeScanner {
  private readonly input: HTMLInputElement;
  private readonly onKeyDown: (e: KeyboardEvent) => void;
  private callback: ((result: ScanResult) => void) | null = null;
  private scanning = false;
  private options: ScanOptions = {};

  public constructor(input: HTMLInputElement) {
    this.input = input;
    this.onKeyDown = (e: KeyboardEvent) => {
      if (!this.scanning) return;
      const suffixes = this.options.suffixes?.length ? this.options.suffixes : ['Enter'];
      if (suffixes.includes(e.key)) {
        e.preventDefault?.();
        const code = this.input.value.trim();
        if (code) this.callback?.({ code, timestamp: Date.now() });
      }
    };
  }

  public startScan(options: ScanOptions = {}): void {
    this.options = options;
    if (this.scanning) return;
    this.scanning = true;
    this.input.addEventListener('keydown', this.onKeyDown);
  }

  public stopScan(): void {
    this.scanning = false;
    this.input.removeEventListener('keydown', this.onKeyDown);
  }

  public onScanResult(callback: (result: ScanResult) => void): Unsubscribe {
    this.callback = callback;
    return () => {
      if (this.callback === callback) this.callback = null;
    };
  }
}
