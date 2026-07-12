/**
 * Ambient declaration for the optional `@capacitor-community/ocr-scanner`
 * plugin used by the Android (Capacitor) shell for OCR camera capture.
 * The plugin is loaded lazily, so it is intentionally NOT a hard dependency
 * of this package — this declaration keeps typechecking green when the
 * plugin is not installed. Shape is the minimal subset the adapter relies on.
 */
declare module '@capacitor-community/ocr-scanner' {
  export const OcrScanner: {
    capture: () => Promise<{ imageReference: string }>;
  };
}
