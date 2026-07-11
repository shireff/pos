/**
 * Ambient declaration for the optional `@capacitor-community/barcode-scanner`
 * plugin used by the Android (Capacitor) shell. The plugin is loaded lazily by
 * the camera scanner adapter, so it is intentionally NOT a hard dependency of
 * this package — this declaration keeps typechecking green when the plugin is
 * not installed. Shape is the minimal subset the adapter relies on.
 */
declare module '@capacitor-community/barcode-scanner' {
  export const BarcodeScanner: {
    startScan: () => Promise<{ hasContent: boolean; content: string }>;
    stopScan: () => Promise<void>;
  };
}
