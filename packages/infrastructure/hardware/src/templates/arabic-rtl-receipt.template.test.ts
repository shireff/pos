import { describe, it, expect } from 'vitest';
import { buildArabicReceiptBytes } from './arabic-rtl-receipt.template';
import { toCp864Bytes } from './arabic-codepage';
import type { ReceiptPayload } from '@packages/application-sales';

function sample(): ReceiptPayload {
  return {
    orderId: 'ord-ar-1',
    lines: [
      { name: 'حليب', qty: 2, unitPricePiasters: 1500 },
      { name: 'خبز', qty: 1, unitPricePiasters: 500 },
    ],
    grandTotalPiasters: 3500,
    companyName: 'متجر الذكي',
    branchName: 'فرع القاهرة',
    cashierId: 'k1',
    taxPiasters: 350,
    taxRegistrationNumber: '123456789',
    language: 'ar',
    createdAt: '2026-07-13T10:30:00Z',
  };
}

function includes(bytes: Uint8Array, seq: number[]): boolean {
  for (let i = 0; i + seq.length <= bytes.length; i++) {
    if (seq.every((b, j) => bytes[i + j] === b)) return true;
  }
  return false;
}

describe('Arabic RTL receipt template', () => {
  it('emits RTL direction and Arabic code-page switch commands', () => {
    const bytes = buildArabicReceiptBytes(sample());
    expect(includes(bytes, [0x1b, 0x74, 32])).toBe(true); // select Arabic code page
    expect(includes(bytes, [0x1b, 0x7b, 1])).toBe(true); // RTL text direction
  });

  it('renders Arabic product names as CP864 bytes (no UTF-16 units)', () => {
    const bytes = buildArabicReceiptBytes(sample());
    // 'حليب' → CP864 [0x8D, 0x9F, 0xA5, 0x88]
    expect(includes(bytes, [0x8d, 0x9f, 0xa5, 0x88])).toBe(true);
  });

  it('renders totals in Arabic-Indic numerals (mixed-direction text)', () => {
    const bytes = buildArabicReceiptBytes(sample());
    // 35.00 EGP → Arabic-Indic "٣٥" = CP864 [0xB3, 0xB5]
    expect(includes(bytes, [0xb3, 0xb5])).toBe(true);
  });

  it('renders the Egyptian date format (DD/MM/YYYY) in Arabic-Indic digits', () => {
    const bytes = buildArabicReceiptBytes(sample());
    // 13/7/2026 → ١٣/٧/٢٠٢٦
    expect(includes(bytes, [0xb1, 0xb3, 0x2f, 0xb7, 0x2f, 0xb2, 0xb0, 0xb2, 0xb6])).toBe(true);
  });

  it('includes the tax registration number', () => {
    const bytes = Array.from(buildArabicReceiptBytes(sample()));
    // '123456789' is ASCII and passes through unchanged.
    expect(includes(new Uint8Array(bytes), [0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39])).toBe(true);
  });

  it('toCp864Bytes maps Arabic letters and ASCII without UTF-16 code units', () => {
    const bytes = toCp864Bytes('حليب ABC');
    expect(bytes).toEqual([0x8d, 0x9f, 0xa5, 0x88, 0x20, 0x41, 0x42, 0x43]);
  });
});
