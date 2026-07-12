/**
 * Ambient declaration for the optional `@capacitor-community/usb-serial` plugin
 * used by the Android (Capacitor) shell to drive USB-serial peripherals
 * (printer, cash drawer, scale). Loaded lazily, so NOT a hard dependency; this
 * keeps typechecking green when the plugin is not installed. Minimal subset.
 */
declare module '@capacitor-community/usb-serial' {
  export const UsbSerial: {
    requestPermission: (opts?: { deviceId?: number; pid?: number; vid?: number }) => Promise<void>;
    open: (opts?: { baudRate?: number; deviceId?: number }) => Promise<void>;
    write: (opts: { data: string }) => Promise<void>;
    read: (opts?: { timeout?: number }) => Promise<{ data: string }>;
    close: () => Promise<void>;
  };
}
