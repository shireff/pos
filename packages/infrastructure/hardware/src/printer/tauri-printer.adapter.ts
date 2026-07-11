import type { ReceiptPrinter } from '@packages/application-sales';
import type { ReceiptPayload, PrintResult } from './types';
import { buildReceiptBytes } from './escpos';
import { PrinterNotAvailableError } from '../errors';

/** Transport used by the Tauri printer adapter to reach the Rust layer. */
export interface TauriPrinterTransport {
  isAvailable(): Promise<boolean>;
  /** Sends ESC/POS command bytes (base64) to the printer Rust command. */
  sendRaw(base64: string): Promise<void>;
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in (window as unknown as Record<string, unknown>);
}

/** Default transport: uses @tauri-apps/api/tauri invoke against the Rust command. */
export class TauriInvokeTransport implements TauriPrinterTransport {
  public async isAvailable(): Promise<boolean> {
    if (!isTauri()) return false;
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const available = await invoke<boolean>('printer_available');
      return available === true;
    } catch {
      return false;
    }
  }

  public async sendRaw(base64: string): Promise<void> {
    if (!isTauri()) throw new PrinterNotAvailableError('Not running inside Tauri');
    const { invoke } = await import('@tauri-apps/api/tauri');
    await invoke('print_receipt', { data: base64 });
  }
}

/**
 * TauriReceiptPrinter is the real adapter for the Desktop (Tauri) shell.
 * It renders the ESC/POS command bytes and dispatches them to the Rust layer.
 * Any failure (offline, paper out, driver error) is surfaced as a
 * PrinterNotAvailableError so the caller can fall back to a digital receipt.
 */
export class TauriReceiptPrinter implements ReceiptPrinter {
  private readonly transport: TauriPrinterTransport;

  public constructor(transport: TauriPrinterTransport = new TauriInvokeTransport()) {
    this.transport = transport;
  }

  public async isAvailable(): Promise<boolean> {
    return this.transport.isAvailable();
  }

  public async print(receipt: ReceiptPayload): Promise<PrintResult> {
    if (!(await this.transport.isAvailable())) {
      throw new PrinterNotAvailableError('Receipt printer is not available');
    }
    const bytes = buildReceiptBytes(receipt);
    const base64 = btoa(String.fromCharCode(...bytes));
    try {
      await this.transport.sendRaw(base64);
      return { success: true, fallbackRequired: false };
    } catch (err) {
      throw new PrinterNotAvailableError('Receipt print failed', err);
    }
  }
}
