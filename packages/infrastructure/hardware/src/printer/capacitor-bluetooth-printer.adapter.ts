import type { ReceiptPrinter, PrintResult, ReceiptPayload, PrinterStatus } from '@packages/application-sales';
import { buildReceiptBytes } from '../printer/escpos';
import { BluetoothNotAvailableError, PrinterNotAvailableError, PaperOutError, PrinterNotReachableError } from '../errors';

export interface CapacitorBluetoothPrinterConfig {
  /** BLE service UUID exposing the write characteristic. */
  service: string;
  /** Write characteristic UUID. */
  characteristic: string;
  /** Pre-paired device id; when omitted the adapter requests a device. */
  deviceId?: string;
}

interface BluetoothLeModule {
  BluetoothLe: {
    isEnabled: () => Promise<{ value: boolean }>;
    requestDevice: (opts?: { services?: string[] }) => Promise<{ deviceId: string; name?: string }>;
    connect: (opts: { deviceId: string }) => Promise<void>;
    write: (opts: { deviceId: string; service: string; characteristic: string; value: string }) => Promise<void>;
    disconnect: (opts: { deviceId: string }) => Promise<void>;
  };
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return typeof btoa !== 'undefined' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');
}

/**
 * CapacitorBluetoothPrinterAdapter drives a Bluetooth LE ESC/POS printer on the
 * Android (Capacitor) shell via `@capacitor-community/bluetooth-le`. The plugin
 * is loaded lazily; no native Kotlin/Java is written (Hardware.md §2 / §0).
 *
 * Any failure (BT off, permission denied, write rejected) is surfaced as a
 * PrinterNotAvailableError subclass so the caller falls back to a digital receipt.
 */
export class CapacitorBluetoothPrinterAdapter implements ReceiptPrinter {
  private readonly config: CapacitorBluetoothPrinterConfig;
  private deviceId: string | null;
  private connected = false;

  public constructor(config: CapacitorBluetoothPrinterConfig) {
    this.config = config;
    this.deviceId = config.deviceId ?? null;
  }

  private async ensurePlugin(): Promise<BluetoothLeModule> {
    const specifier = '@capacitor-community/bluetooth-le';
    try {
      return (await import(/* @vite-ignore */ specifier)) as unknown as BluetoothLeModule;
    } catch {
      throw new BluetoothNotAvailableError('Bluetooth LE plugin is not available');
    }
  }

  private async ensureConnected(): Promise<BluetoothLeModule> {
    const mod = await this.ensurePlugin();
    const enabled = await mod.BluetoothLe.isEnabled().catch(() => ({ value: false }));
    if (!enabled.value) throw new BluetoothNotAvailableError('Bluetooth is disabled');
    if (!this.deviceId) {
      const device = await mod.BluetoothLe.requestDevice({ services: [this.config.service] });
      this.deviceId = device.deviceId;
    }
    if (!this.connected) {
      await mod.BluetoothLe.connect({ deviceId: this.deviceId });
      this.connected = true;
    }
    return mod;
  }

  private async send(bytes: Uint8Array): Promise<void> {
    const mod = await this.ensureConnected();
    await mod.BluetoothLe.write({
      deviceId: this.deviceId as string,
      service: this.config.service,
      characteristic: this.config.characteristic,
      value: toBase64(bytes),
    });
  }

  private async doPrint(payload: ReceiptPayload): Promise<PrintResult> {
    try {
      await this.send(buildReceiptBytes(payload));
      return { success: true, fallbackRequired: false };
    } catch (err) {
      if (err instanceof BluetoothNotAvailableError) throw err;
      const message = String((err as Error)?.message ?? '').toLowerCase();
      if (message.includes('paper')) throw new PaperOutError('Bluetooth printer is out of paper', err);
      if (message.includes('reachable')) throw new PrinterNotReachableError('Bluetooth printer not reachable', err);
      throw new PrinterNotAvailableError('Bluetooth print failed', err);
    }
  }

  public async isAvailable(): Promise<boolean> {
    try {
      return (await this.ensurePlugin()).BluetoothLe.isEnabled().then((r) => r.value);
    } catch {
      return false;
    }
  }

  public async print(receipt: ReceiptPayload): Promise<PrintResult> {
    return this.doPrint(receipt);
  }

  public async testPrint(): Promise<PrintResult> {
    return this.doPrint({
      orderId: 'TEST',
      lines: [{ name: 'Test', qty: 1, unitPricePiasters: 0 }],
      grandTotalPiasters: 0,
      companyName: 'Smart Retail OS',
      branchName: 'TEST',
      cashierId: 'SELF-TEST',
    });
  }

  public async getStatus(): Promise<PrinterStatus> {
    try {
      return { connected: await this.isAvailable(), isNoop: false } as const;
    } catch (err) {
      return { connected: false, isNoop: false, reason: String((err as Error)?.message ?? err) } as const;
    }
  }
}
