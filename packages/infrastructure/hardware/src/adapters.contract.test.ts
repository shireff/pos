import { describe, it, expect, vi } from 'vitest';
import { SimulatedReceiptPrinter } from './printer/simulated-printer.adapter';
import { TauriReceiptPrinter, TauriPrinterTransport } from './printer/tauri-printer.adapter';
import { SimulatedCashDrawer } from './drawer/simulated-drawer.adapter';
import { TauriCashDrawer, TauriDrawerTransport } from './drawer/tauri-drawer.adapter';
import { HidBarcodeScanner } from './scanner/hid-scanner.adapter';
import { PrinterNotAvailableError, DrawerOpenError } from './errors';
import type { ReceiptPayload } from './printer/types';

function payload(): ReceiptPayload {
  return {
    orderId: 'ord-9',
    lines: [{ name: 'Item', qty: 1, unitPricePiasters: 1000 }],
    grandTotalPiasters: 1000,
    companyName: 'Co',
    branchName: 'Br',
    cashierId: 'k1',
  };
}

describe('ReceiptPrinter adapter contract (Hardware.md §7)', () => {
  it('simulated adapter records payload and reports success', async () => {
    const p = new SimulatedReceiptPrinter();
    const res = await p.print(payload());
    expect(res).toEqual({ success: true, fallbackRequired: false });
    expect(p.lastPayload?.orderId).toBe('ord-9');
    expect(p.printCallCount).toBe(1);
    expect(await p.isAvailable()).toBe(true);
  });

  it('tauri adapter sends ESC/POS bytes and reports success', async () => {
    const sendRaw = vi.fn().mockResolvedValue(undefined);
    const transport: TauriPrinterTransport = {
      isAvailable: vi.fn().mockResolvedValue(true),
      sendRaw,
    };
    const p = new TauriReceiptPrinter(transport);
    const res = await p.print(payload());
    expect(res.success).toBe(true);
    expect(sendRaw).toHaveBeenCalledTimes(1);
    const arg = sendRaw.mock.calls[0][0] as string;
    expect(typeof arg).toBe('string'); // base64 command bytes
  });

  it('tauri adapter throws PrinterNotAvailableError when printer unavailable', async () => {
    const transport: TauriPrinterTransport = {
      isAvailable: vi.fn().mockResolvedValue(false),
      sendRaw: vi.fn(),
    };
    const p = new TauriReceiptPrinter(transport);
    await expect(p.print(payload())).rejects.toBeInstanceOf(PrinterNotAvailableError);
  });
});

describe('CashDrawer adapter contract (Hardware.md §4)', () => {
  it('simulated drawer opens successfully', async () => {
    const d = new SimulatedCashDrawer();
    expect((await d.open()).success).toBe(true);
    expect(d.openCallCount).toBe(1);
  });

  it('tauri drawer throws DrawerOpenError on failure (non-blocking)', async () => {
    const transport: TauriDrawerTransport = { pulse: vi.fn().mockRejectedValue(new Error('jammed')) };
    const d = new TauriCashDrawer(transport);
    await expect(d.open()).rejects.toBeInstanceOf(DrawerOpenError);
  });
});

describe('HidBarcodeScanner (Hardware.md §3)', () => {
  it('emits the decoded code on Enter', () => {
    const listeners: Record<string, ((e: KeyboardEvent) => void) | undefined> = {};
    const input = {
      value: '',
      addEventListener: (type: string, fn: (e: KeyboardEvent) => void) => {
        listeners[type] = fn;
      },
      removeEventListener: (type: string) => {
        delete listeners[type];
      },
    } as unknown as HTMLInputElement;
    const scanner = new HidBarcodeScanner(input);
    const handler = vi.fn();
    scanner.onScanResult(handler);
    scanner.startScan();
    input.value = '123456789';
    listeners['keydown']?.({ key: 'Enter' } as unknown as KeyboardEvent);
    expect(handler).toHaveBeenCalledWith({ code: '123456789', timestamp: expect.any(Number) });
    scanner.stopScan();
  });
});
