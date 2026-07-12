import type { Scale, WeightReading } from '@packages/application-sales';
import { ScaleNotConnectedError } from '../errors';

export interface TauriScaleTransport {
  read(): Promise<{ grams: number; isStable: boolean }>;
  tare(): Promise<void>;
  isAvailable(): Promise<boolean>;
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in (window as unknown as Record<string, unknown>);
}

export class TauriInvokeScaleTransport implements TauriScaleTransport {
  public async isAvailable(): Promise<boolean> {
    if (!isTauri()) return false;
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      return (await invoke<boolean>('scale_available')) === true;
    } catch {
      return false;
    }
  }

  public async read(): Promise<{ grams: number; isStable: boolean }> {
    if (!isTauri()) throw new ScaleNotConnectedError('Not running inside Tauri');
    const { invoke } = await import('@tauri-apps/api/tauri');
    const res = await invoke<{ grams: number; stable: boolean }>('read_scale_weight');
    return { grams: res.grams, isStable: res.stable };
  }

  public async tare(): Promise<void> {
    if (!isTauri()) throw new ScaleNotConnectedError('Not running inside Tauri');
    const { invoke } = await import('@tauri-apps/api/tauri');
    await invoke('tare_scale');
  }
}

/**
 * TauriUsbScaleAdapter reads a USB serial scale through the Tauri command layer.
 * A disconnected scale throws ScaleNotConnectedError which the caller converts
 * into a manual weight-entry prompt — it MUST NOT block the sale (Hardware.md §5).
 */
export class TauriUsbScaleAdapter implements Scale {
  private readonly transport: TauriScaleTransport;

  public constructor(transport: TauriScaleTransport = new TauriInvokeScaleTransport()) {
    this.transport = transport;
  }

  public async readWeight(): Promise<WeightReading | null> {
    try {
      const { grams, isStable } = await this.transport.read();
      return { grams, unit: 'kg', isStable };
    } catch (err) {
      if (err instanceof ScaleNotConnectedError) return null;
      throw err;
    }
  }

  public async tare(): Promise<void> {
    try {
      await this.transport.tare();
    } catch (err) {
      if (err instanceof ScaleNotConnectedError) return;
      throw err;
    }
  }

  public async getStatus() {
    const connected = await this.transport.isAvailable().catch(() => false);
    return { connected, isNoop: false } as const;
  }
}
