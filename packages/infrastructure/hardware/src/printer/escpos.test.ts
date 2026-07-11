import { describe, it, expect } from 'vitest';
import { buildReceiptBytes, EscPosBuilder } from './escpos';
import type { ReceiptPayload } from './types';

function samplePayload(): ReceiptPayload {
  return {
    orderId: 'ord-1',
    lines: [{ name: 'Pepsi 1L', qty: 2, unitPricePiasters: 1500 }],
    grandTotalPiasters: 3000,
    taxPiasters: 0,
    discountPiasters: 0,
    companyName: 'Smart Retail Co',
    branchName: 'Cairo Branch',
    cashierId: 'k1',
    createdAt: '2026-07-10T12:00:00Z',
  };
}

describe('EscPosBuilder', () => {
  it('initializes the printer first', () => {
    const bytes = new EscPosBuilder().initialize().build();
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x1b, 0x40]);
  });

  it('cuts at the end', () => {
    const bytes = new EscPosBuilder().initialize().cut().build();
    expect(Array.from(bytes.slice(-3))).toEqual([0x1d, 0x56, 0x00]);
  });
});

describe('buildReceiptBytes', () => {
  it('emits init, header, a line, total footer, and a cut', () => {
    const bytes = buildReceiptBytes(samplePayload());
    const arr = Array.from(bytes);
    expect(arr[0]).toBe(0x1b);
    expect(arr[1]).toBe(0x40);
    expect(arr.slice(-3)).toEqual([0x1d, 0x56, 0x00]);
    // company name present as ASCII bytes
    expect(arr.includes('S'.charCodeAt(0))).toBe(true);
    // total appears as "30.00" text
    const text = String.fromCharCode(...arr);
    expect(text).toContain('TOTAL: 30.00 EGP');
  });

  it('includes discount and tax when positive', () => {
    const bytes = buildReceiptBytes({ ...samplePayload(), discountPiasters: 500, taxPiasters: 200 });
    const text = String.fromCharCode(...Array.from(bytes));
    expect(text).toContain('Discount: -5.00');
    expect(text).toContain('Tax: 2.00');
  });
});
