import type { BarcodeScanner, Unsubscribe } from '@packages/application-sales';

/**
 * CapacitorCameraBarcodeScanner is the Android (Capacitor) adapter backed by
 * `@capacitor-community/barcode-scanner`. It is loaded lazily so the package
 * remains optional: if the plugin is not installed or the device has no camera,
 * `start()` rejects and the caller falls back to HID wedge / manual entry.
 *
 * Per Hardware.md §3, no native Kotlin/Java code is written — the Capacitor
 * plugin handles camera access and on-device decoding.
 */
export class CapacitorCameraBarcodeScanner implements BarcodeScanner {
  private handler: ((code: string) => void) | null = null;
  private scanning = false;
  private plugin: { startScan: () => Promise<{ hasContent: boolean; content: string }>; stopScan: () => Promise<void> } | null = null;

  public async start(): Promise<void> {
    if (this.scanning) return;
    // Optional plugin: loaded lazily by a non-literal specifier so typechecking
    // never requires it to be installed. The ambient declaration in
    // src/types/capacitor-barcode-scanner.d.ts describes the minimal shape.
    const specifier = '@capacitor-community/barcode-scanner';
    const mod = (await import(/* @vite-ignore */ specifier)) as unknown as {
      BarcodeScanner: { startScan: () => Promise<{ hasContent: boolean; content: string }>; stopScan: () => Promise<void> };
    };
    this.plugin = mod.BarcodeScanner;
    this.scanning = true;
    void this.loop();
  }

  public async stop(): Promise<void> {
    this.scanning = false;
    try {
      await this.plugin?.stopScan();
    } catch {
      // ignore — plugin may already be stopped
    }
  }

  private async loop(): Promise<void> {
    while (this.scanning && this.plugin) {
      try {
        const result = await this.plugin.startScan();
        if (result.hasContent && result.content && this.handler) {
          this.handler(result.content);
        }
      } catch {
        this.scanning = false;
        return;
      }
    }
  }

  public onScan(handler: (code: string) => void): Unsubscribe {
    this.handler = handler;
    return () => {
      this.handler = null;
    };
  }
}
