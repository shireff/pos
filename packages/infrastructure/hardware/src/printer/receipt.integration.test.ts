import { describe, it, expect, vi } from 'vitest';
import { SimulatedReceiptPrinter } from './simulated-printer.adapter';
import { TauriReceiptPrinter, type TauriPrinterTransport } from './tauri-printer.adapter';
import { PrinterNotAvailableError } from '../errors';
import type { ReceiptPayload } from './types';

function payload(): ReceiptPayload {
  return {
    orderId: 'ord-rcpt',
    lines: [{ name: 'Item', qty: 1, unitPricePiasters: 1000 }],
    grandTotalPiasters: 1000,
    companyName: 'Smart Retail OS',
    branchName: 'Cairo',
    cashierId: 'k1',
  };
}

/**
 * Receipt integration (TESTS.md: sales/receipt.integration.test.ts).
 * Verifies both halves of the fallback contract: a successful print returns a
 * success result, and an unavailable/errored printer surfaces
 * PrinterNotAvailableError so the caller can show the digital receipt.
 */
describe('receipt integration — sales/receipt.integration.test.ts', () => {
  it('printed successfully → PrintResult.success', async () => {
    const printer = new SimulatedReceiptPrinter();
    const res = await printer.print(payload());
    expect(res).toEqual({ success: true, fallbackRequired: false });
    expect((await printer.isAvailable())).toBe(true);
  });

  it('printer unavailable → throws PrinterNotAvailableError (digital fallback)', async () => {
    const transport: TauriPrinterTransport = {
      isAvailable: vi.fn().mockResolvedValue(false),
      sendRaw: vi.fn(),
    };
    const printer = new TauriReceiptPrinter(transport);
    await expect(printer.print(payload())).rejects.toBeInstanceOf(PrinterNotAvailableError);
  });

  it('print error → throws PrinterNotAvailableError (digital fallback)', async () => {
    const transport: TauriPrinterTransport = {
      isAvailable: vi.fn().mockResolvedValue(true),
      sendRaw: vi.fn().mockRejectedValue(new Error('paper jam')),
    };
    const printer = new TauriReceiptPrinter(transport);
    await expect(printer.print(payload())).rejects.toBeInstanceOf(PrinterNotAvailableError);
  });
});
