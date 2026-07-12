import type { CashDrawer, DrawerResult, DrawerStatus } from '@packages/application-sales';
import { UsbNotGrantedError, DrawerNotConnectedError } from '../errors';

export interface CapacitorUsbSerialDrawerConfig {
  vid?: number;
  pid?: number;
  deviceId?: number;
  baudRate?: number;
}

/**
 * CapacitorUsbSerialDrawerAdapter opens a USB-serial cash drawer on the Android
 * (Capacitor) shell. The pulse is sent as a one-byte command over the serial
 * link. A denied permission or missing device surfaces as a non-blocking error
 * (Hardware.md §4): the caller logs and prompts a manual open, the sale still
 * completes. No native Kotlin/Java is written (Hardware.md §0).
 */
export class CapacitorUsbSerialDrawerAdapter implements CashDrawer {
  private readonly config: CapacitorUsbSerialDrawerConfig;
  private opened = false;

  public constructor(config: CapacitorUsbSerialDrawerConfig = {}) {
    this.config = config;
  }

  private async ensurePlugin() {
    const specifier = '@capacitor-community/usb-serial';
    try {
      return (await import(/* @vite-ignore */ specifier)) as unknown as {
        UsbSerial: {
          requestPermission: (opts?: { deviceId?: number; pid?: number; vid?: number }) => Promise<void>;
          open: (opts?: { baudRate?: number; deviceId?: number }) => Promise<void>;
          write: (opts: { data: string }) => Promise<void>;
          close: () => Promise<void>;
        };
      };
    } catch {
      throw new UsbNotGrantedError('USB serial plugin is not available');
    }
  }

  private async pulse(): Promise<void> {
    const mod = await this.ensurePlugin();
    try {
      await mod.UsbSerial.requestPermission({ vid: this.config.vid, pid: this.config.pid, deviceId: this.config.deviceId });
    } catch {
      throw new UsbNotGrantedError('USB serial permission denied');
    }
    if (!this.opened) {
      await mod.UsbSerial.open({ baudRate: this.config.baudRate ?? 9600, deviceId: this.config.deviceId });
      this.opened = true;
    }
    // ESC/POS drawer kick command (0x10 0x14 0x01 <pin> <on-time>).
    await mod.UsbSerial.write({ data: 'EAQ' });
  }

  public async open(): Promise<DrawerResult> {
    try {
      await this.pulse();
      return { success: true };
    } catch (err) {
      if (err instanceof UsbNotGrantedError) throw err;
      throw new DrawerNotConnectedError('USB serial drawer failed to open', err);
    }
  }

  public async getStatus(): Promise<DrawerStatus> {
    try {
      await this.ensurePlugin();
      return { connected: true, isNoop: false } as const;
    } catch (err) {
      return { connected: false, isNoop: false, reason: String((err as Error)?.message ?? err) } as const;
    }
  }
}
