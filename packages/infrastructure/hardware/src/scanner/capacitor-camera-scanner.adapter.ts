import type { BarcodeScanner, Unsubscribe, ScanResult } from '@packages/application-sales';

/**
 * CapacitorCameraBarcodeScanner is the Android (Capacitor) adapter backed by
 * `@capacitor-community/barcode-scanner`. It is loaded lazily so the package
 * remains optional: if the plugin is not installed or the device has no camera,
 * scanner start is a no-op and the caller falls back to HID wedge / manual entry.
 *
 * Per Hardware.md §3, no native Kotlin/Java code is written — the Capacitor
 * plugin handles camera access and on-device decoding.
 */
export class CapacitorCameraBarcodeScanner implements BarcodeScanner {
  private callback: ((result: ScanResult) => void) | null = null;
  private scanning = false;
  private plugin: { startScan: () => Promise<{ hasContent: boolean; content: string }>; stopScan: () => Promise<void> } | null = null;

  public startScan(): void {
    if (this.scanning) return;
    this.scanning = true;
    void this.initAndLoop();
  }

  private async initAndLoop(): Promise<void> {
    // Optional plugin: loaded lazily by a non-literal specifier so typechecking
    // never requires it to be installed. The ambient declaration in
    // src/types/capacitor-barcode-scanner.d.ts describes the minimal shape.
    const specifier = '@capacitor-community/barcode-scanner';
    try {
      const mod = (await import(/* @vite-ignore */ specifier)) as unknown as {
        BarcodeScanner: { startScan: () => Promise<{ hasContent: boolean; content: string }>; stopScan: () => Promise<void> };
      };
      this.plugin = mod.BarcodeScanner;
    } catch {
      // Plugin unavailable — scanning silently disabled; caller shows manual entry.
      this.scanning = false;
      return;
    }
    void this.loop();
  }

  public stopScan(): void {
    this.scanning = false;
    void this.plugin?.stopScan().catch(() => undefined);
  }

  private async loop(): Promise<void> {
    while (this.scanning && this.plugin) {
      try {
        const result = await this.plugin.startScan();
        if (result.hasContent && result.content && this.callback) {
          this.callback({ code: result.content, timestamp: Date.now() });
        }
      } catch {
        this.scanning = false;
        return;
      }
    }
  }

  public onScanResult(callback: (result: ScanResult) => void): Unsubscribe {
    this.callback = callback;
    return () => {
      if (this.callback === callback) this.callback = null;
    };
  }
}
