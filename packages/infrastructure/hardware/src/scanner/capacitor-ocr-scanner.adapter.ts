/**
 * CapacitorCameraOcrScanner is the Android (Capacitor) adapter for OCR camera capture.
 * It is loaded lazily so the package remains optional: if the plugin is not installed,
 * capture() rejects and the caller falls back to manual entry or other input.
 */
export class CapacitorCameraOcrScanner {
  private plugin: { capture: () => Promise<{ imageReference: string }> } | null = null;

  public async capture(): Promise<string> {
    if (this.plugin) {
      const result = await this.plugin.capture();
      return result.imageReference;
    }

    const specifier = '@capacitor-community/ocr-scanner';
    try {
      const mod = await import(/* @vite-ignore */ specifier);
      this.plugin = (mod as unknown as { OcrScanner: { capture: () => Promise<{ imageReference: string }> } }).OcrScanner;
      const result = await this.plugin.capture();
      return result.imageReference;
    } catch {
      throw new Error('OCR camera scanner plugin not available');
    }
  }
}
