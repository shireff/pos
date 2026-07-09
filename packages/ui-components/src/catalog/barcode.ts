/* Pure EAN-13 barcode encoder (no dependencies).
   Produces the 95-module bit pattern used by real barcode scanners. */

const L_CODE: string[] = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011',
];
const G_CODE: string[] = [
  '1110010', '1100110', '1101100', '1000010', '1011100',
  '1001110', '1010000', '1000100', '1001000', '1110100',
];
const R_CODE: string[] = [
  '1110010', '1001100', '1100100', '1011110', '1100010',
  '1000110', '1111010', '1101110', '1110110', '1101000',
];
const PARITY: string[] = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGGGL',
];

export function computeEan13CheckDigit(first12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = Number(first12[i]);
    sum += (Number.isNaN(d) ? 0 : d) * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

export interface BarcodeEncoding {
  bits: string;
  code: string;
  valid: boolean;
}

/** Encode a value as EAN-13 when possible; returns decorative bits otherwise. */
export function encodeBarcode(raw: string): BarcodeEncoding {
  const digits = (raw || '').replace(/\D/g, '');
  let code = digits;
  if (code.length === 12) code += computeEan13CheckDigit(code);
  if (code.length === 13 && /^\d{13}$/.test(code)) {
    const first = Number(code[0]);
    let bits = '101';
    for (let i = 0; i < 6; i++) {
      const d = Number(code[1 + i]);
      bits += PARITY[first][i] === 'L' ? L_CODE[d] : G_CODE[d];
    }
    bits += '01010';
    for (let i = 0; i < 6; i++) {
      const d = Number(code[7 + i]);
      bits += R_CODE[d];
    }
    bits += '101';
    return { bits, code, valid: true };
  }
  // Decorative fallback (deterministic from the string) — not scannable.
  let bits = '101';
  const seed = (raw || '').split('').reduce((a, c) => a + c.charCodeAt(0), 7);
  for (let i = 0; i < 60; i++) {
    bits += (seed >> (i % 13)) & 1 ? '11' : '1';
  }
  bits = bits.slice(0, 95).padEnd(95, '1');
  return { bits, code: raw, valid: false };
}
