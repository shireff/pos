import type { BarcodeScanner, Unsubscribe } from '@packages/application-sales';

/**
 * HidBarcodeScanner adapts a keyboard-wedge (HID) scanner. A HID scanner behaves
 * as rapid keyboard input into a focused text field terminated by Enter. The POS
 * barcode input is kept always-focused specifically to catch this stream
 * (Hardware.md §3). This adapter attaches to that input and emits the decoded
 * string on Enter; it performs no validation (that lives in the application
 * layer).
 */
export class HidBarcodeScanner implements BarcodeScanner {
  private readonly input: HTMLInputElement;
  private readonly onKeyDown: (e: KeyboardEvent) => void;

  public constructor(input: HTMLInputElement) {
    this.input = input;
    this.onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const code = this.input.value.trim();
        if (code) this.handler?.(code);
      }
    };
    this.input.addEventListener('keydown', this.onKeyDown);
  }

  private handler: ((code: string) => void) | null = null;

  public onScan(handler: (code: string) => void): Unsubscribe {
    this.handler = handler;
    return () => {
      if (this.handler === handler) this.handler = null;
    };
  }

  public dispose(): void {
    this.input.removeEventListener('keydown', this.onKeyDown);
    this.handler = null;
  }
}
