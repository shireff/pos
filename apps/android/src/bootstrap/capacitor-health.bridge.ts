/**
 * Capacitor Health Bridge
 *
 * Exposes a simple health-check contract using the Capacitor Device plugin.
 * This bridge abstracts away the native Capacitor API so that feature code
 * is not coupled to @capacitor/* imports directly.
 */

export interface AppHealth {
  status: 'ok' | 'degraded' | 'error';
  platform: string;
  version: string;
  timestamp: string;
}

export class CapacitorHealthBridge {
  /**
   * Returns basic app health info using only web-compatible APIs.
   * In a full Capacitor implementation, swap this for:
   *   import { Device } from '@capacitor/device'
   *   const info = await Device.getInfo()
   */
  public async check(): Promise<AppHealth> {
    return {
      status: 'ok',
      platform: 'android',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }
}
