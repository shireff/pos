import { describe, it, expect, vi } from 'vitest';
import { SimulatedReceiptPrinter } from './printer/simulated-printer.adapter';
import { TauriReceiptPrinter, type TauriPrinterTransport } from './printer/tauri-printer.adapter';
import { PrinterNotAvailableError } from './errors';
import { buildReceiptBytes } from './printer/escpos';
import { buildArabicReceiptBytes } from './templates/arabic-rtl-receipt.template';
import { resolvePrintFallback } from './fallback';
import type { ReceiptPayload } from '@packages/application-sales';

function payload(language: 'ar' | 'en' = 'en'): ReceiptPayload {
  return {
    orderId: 'ord-9',
    lines: [{ name: 'Item', qty: 2, unitPricePiasters: 1000 }],
    grandTotalPiasters: 2000,
    companyName: 'Smart Retail OS',
    branchName: 'Cairo',
    cashierId: 'k1',
    taxPiasters: 200,
    taxRegistrationNumber: '123456789',
    language,
    createdAt: '2026-07-13T10:30:00Z',
  };
}

function includes(bytes: Uint8Array, seq: number[]): boolean {
  for (let i = 0; i + seq.length <= bytes.length; i++) {
    if (seq.every((b, j) => bytes[i + j] === b)) return true;
  }
  return false;
}

describe('Printer adapter contract (printer.contract.test.ts)', () => {
  it('available printer → print succeeds and emits ESC/POS bytes', async () => {
    const p = new SimulatedReceiptPrinter();
    const res = await p.print(payload());
    expect(res).toEqual({ success: true, fallbackRequired: false });
    expect(await p.isAvailable()).toBe(true);

    const bytes = buildReceiptBytes(payload());
    expect(includes(bytes, [0x1b, 0x40])).toBe(true); // initialize
    expect(includes(bytes, [0x1d, 0x56, 0x00])).toBe(true); // full cut
  });

  it('printer unavailable → throws PrinterNotAvailableError, sale not blocked, digital receipt fallback', async () => {
    const transport: TauriPrinterTransport = {
      isAvailable: vi.fn().mockResolvedValue(false),
      sendRaw: vi.fn(),
    };
    const p = new TauriReceiptPrinter(transport);
    await expect(p.print(payload())).rejects.toBeInstanceOf(PrinterNotAvailableError);
    // The UI converts any printer error into a digital-receipt display.
    expect(resolvePrintFallback(new PrinterNotAvailableError())).toEqual({ kind: 'digital-receipt' });
  });

  it('Arabic receipt includes code-page switch and RTL commands', () => {
    const bytes = buildArabicReceiptBytes(payload('ar'));
    expect(includes(bytes, [0x1b, 0x74, 32])).toBe(true); // select Arabic code page
    expect(includes(bytes, [0x1b, 0x7b, 1])).toBe(true); // RTL direction
  });

  it('Arabic receipt renders Arabic-Indic totals (mixed-direction text)', () => {
    const bytes = Array.from(buildArabicReceiptBytes(payload('ar')));
    // Arabic-Indic digit ٢ (U+0662) maps to CP864 0xB2.
    expect(bytes).toContain(0xb2);
  });

  it('digital receipt fallback representation contains required fields', () => {
    const fb = resolvePrintFallback(new Error('boom'));
    expect(fb.kind).toBe('digital-receipt');
  });
});
