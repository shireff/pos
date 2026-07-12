/**
 * Ambient declaration for the optional `@capacitor-community/bluetooth-le`
 * plugin used by the Android (Capacitor) shell to send ESC/POS bytes to a
 * Bluetooth Low Energy printer. Loaded lazily, so NOT a hard dependency; this
 * keeps typechecking green when the plugin is not installed. Minimal subset.
 */
declare module '@capacitor-community/bluetooth-le' {
  export const BluetoothLe: {
    isEnabled: () => Promise<{ value: boolean }>;
    requestDevice: (opts?: { services?: string[] }) => Promise<{ deviceId: string; name?: string }>;
    connect: (opts: { deviceId: string }) => Promise<void>;
    write: (opts: { deviceId: string; service: string; characteristic: string; value: string }) => Promise<void>;
    disconnect: (opts: { deviceId: string }) => Promise<void>;
  };
}
