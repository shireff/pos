import type { Scale, WeightReading } from '@packages/application-sales';
import { UsbNotGrantedError, ScaleNotConnectedError } from '../errors';

export interface CapacitorUsbSerialScaleConfig {
  vid?: number;
  pid?: number;
  deviceId?: number;
  baudRate?: number;
}

/**
 * CapacitorUsbSerialScaleAdapter reads a USB-serial scale on the Android
 * (Capacitor) shell. A disconnected scale or denied permission yields a null
 * weight so the caller can show a manual weight-entry prompt (Hardware.md §5).
 * No native Kotlin/Java is written (Hardware.md §0).
 */
export class CapacitorUsbSerialScaleAdapter implements Scale {
  private readonly config: CapacitorUsbSerialScaleConfig;
  private opened = false;

  public constructor(config: CapacitorUsbSerialScaleConfig = {}) {
    this.config = config;
  }

  private async ensurePlugin() {
    const specifier = '@capacitor-community/usb-serial';
    try {
      return (await import(/* @vite-ignore */ specifier)) as unknown as {
        UsbSerial: {
          requestPermission: (opts?: { deviceId?: number; pid?: number; vid?: number }) => Promise<void>;
          open: (opts?: { baudRate?: number; deviceId?: number }) => Promise<void>;
          read: (opts?: { timeout?: number }) => Promise<{ data: string }>;
          write: (opts: { data: string }) => Promise<void>;
          close: () => Promise<void>;
        };
      };
    } catch {
      throw new UsbNotGrantedError('USB serial plugin is not available');
    }
  }

  public async readWeight(): Promise<WeightReading | null> {
    try {
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
      const res = await mod.UsbSerial.read({ timeout: 1000 });
      const match = /([0-9]+(?:[.,][0-9]+)?)/.exec(res.data ?? '');
      if (!match) return { grams: 0, unit: 'kg', isStable: false };
      const value = parseFloat(match[1].replace(',', '.'));
      const grams = value >= 1000 ? Math.round(value) : Math.round(value * 1000);
      return { grams, unit: 'kg', isStable: true };
    } catch (err) {
      if (err instanceof UsbNotGrantedError || err instanceof ScaleNotConnectedError) return null;
      throw err;
    }
  }

  public async tare(): Promise<void> {
    try {
      const mod = await this.ensurePlugin();
      await mod.UsbSerial.requestPermission({ vid: this.config.vid, pid: this.config.pid, deviceId: this.config.deviceId }).catch(() => undefined);
      await mod.UsbSerial.write({ data: 't' });
    } catch (err) {
      if (err instanceof UsbNotGrantedError) return;
      throw err;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; isNoop: boolean }> {
    try {
      await this.ensurePlugin();
      return { connected: true, isNoop: false } as const;
    } catch {
      return { connected: false, isNoop: false } as const;
    }
  }
}
