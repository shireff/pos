import type { ReceiptPrinter, PrintResult, ReceiptPayload, PrinterStatus } from '@packages/application-sales';
import { buildReceiptBytes } from '../printer/escpos';
import { UsbNotGrantedError, PrinterNotAvailableError, PaperOutError, PrinterNotReachableError } from '../errors';

export interface CapacitorUsbSerialPrinterConfig {
  /** USB vendor/product id to request permission for. */
  vid?: number;
  pid?: number;
  deviceId?: number;
  baudRate?: number;
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return typeof btoa !== 'undefined' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');
}

/**
 * CapacitorUsbSerialPrinterAdapter drives a USB-serial ESC/POS printer on the
 * Android (Capacitor) shell via `@capacitor-community/usb-serial`. The plugin is
 * loaded lazily; no native Kotlin/Java is written (Hardware.md §2 / §0).
 *
 * A denied USB permission surfaces as UsbNotGrantedError and the caller falls
 * back to a digital receipt rather than blocking the sale.
 */
export class CapacitorUsbSerialPrinterAdapter implements ReceiptPrinter {
  private readonly config: CapacitorUsbSerialPrinterConfig;
  private opened = false;

  public constructor(config: CapacitorUsbSerialPrinterConfig = {}) {
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

  private async ensureOpen() {
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
    return mod;
  }

  private async send(bytes: Uint8Array): Promise<void> {
    const mod = await this.ensureOpen();
    await mod.UsbSerial.write({ data: toBase64(bytes) });
  }

  private async doPrint(payload: ReceiptPayload): Promise<PrintResult> {
    try {
      await this.send(buildReceiptBytes(payload));
      return { success: true, fallbackRequired: false };
    } catch (err) {
      if (err instanceof UsbNotGrantedError) throw err;
      if (String((err as Error)?.message ?? '').toLowerCase().includes('paper')) {
        throw new PaperOutError('USB printer is out of paper', err);
      }
      if (String((err as Error)?.message ?? '').toLowerCase().includes('reachable')) {
        throw new PrinterNotReachableError('USB printer not reachable', err);
      }
      throw new PrinterNotAvailableError('USB print failed', err);
    }
  }

  public async isAvailable(): Promise<boolean> {
    try {
      await this.ensurePlugin();
      return true;
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
    const available = await this.isAvailable().catch(() => false);
    return { connected: available, isNoop: false } as const;
  }
}
