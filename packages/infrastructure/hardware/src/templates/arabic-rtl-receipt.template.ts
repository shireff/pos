import type { ReceiptPayload } from '@packages/application-sales';
import { toCp864Bytes, toArabicIndic } from './arabic-codepage';

/**
 * ArabicRtlReceiptTemplate renders an ESC/POS receipt right-to-left with Arabic
 * product names and Arabic-Indic totals. It emits:
 *   - initialize / reset
 *   - code-page switch to Arabic (ESC t 32 → CP864)
 *   - RTL text direction (ESC { 1)
 *   - Arabic company name + branch
 *   - date in Egyptian format (DD/MM/YYYY HH:mm)
 *   - tax registration number
 *   - one line per item (Arabic name, qty × unit price, line total)
 *   - discount / tax / grand total in Arabic-Indic digits
 *   - full cut
 *
 * Mixed-direction text (Arabic name + numeric price) is handled by emitting the
 * Arabic name in CP864 bytes and the numeric price in Arabic-Indic digits, so no
 * joining/positioning artifacts appear (Hardware.md §2).
 */
export class ArabicRtlReceiptTemplate {
  private readonly chunks: number[] = [];

  /** ESC @ — initialize. */
  private initialize(): this {
    this.chunks.push(0x1b, 0x40);
    return this;
  }

  /** ESC t n — select character code table (32 = Arabic / CP864). */
  private selectArabicCodepage(): this {
    this.chunks.push(0x1b, 0x74, 32);
    return this;
  }

  /** ESC { n — text direction; n=1 reverses to RTL. */
  private setRtl(on: boolean): this {
    this.chunks.push(0x1b, 0x7b, on ? 1 : 0);
    return this;
  }

  /** ESC E n — emphasis on/off. */
  private setEmphasis(on: boolean): this {
    this.chunks.push(0x1b, 0x45, on ? 1 : 0);
    return this;
  }

  private arabicLine(value = ''): this {
    this.chunks.push(...toCp864Bytes(value), 0x0a);
    return this;
  }

  private feed(lines: number): this {
    this.chunks.push(0x1b, 0x64, lines);
    return this;
  }

  private cut(): this {
    this.chunks.push(0x1d, 0x56, 0x00);
    return this;
  }

  private moneyPiasters(piasters: number): string {
    const egp = (piasters / 100).toFixed(2);
    return `${toArabicIndic(egp)} EGP`; // numeric value in Arabic-Indic digits
  }

  private egyptianDate(iso?: string): string {
    const d = iso ? new Date(iso) : new Date();
    if (Number.isNaN(d.getTime())) return this.egyptianDate(undefined);
    const day = toArabicIndic(d.getDate());
    const month = toArabicIndic(d.getMonth() + 1);
    const year = toArabicIndic(d.getFullYear());
    const hh = toArabicIndic(d.getHours());
    const mm = toArabicIndic(d.getMinutes());
    return `${day}/${month}/${year} ${hh}:${mm}`;
  }

  public build(payload: ReceiptPayload): Uint8Array {
    this.chunks.length = 0;
    this.initialize();
    this.selectArabicCodepage();
    this.setRtl(true);

    this.setEmphasis(true);
    this.arabicLine(payload.companyName);
    this.arabicLine(payload.branchName);
    this.setEmphasis(false);
    this.arabicLine(`#${payload.orderId}`);
    if (payload.createdAt) this.arabicLine(this.egyptianDate(payload.createdAt));
    this.arabicLine('--------------------------------');
    for (const l of payload.lines) {
      const lineTotal = l.qty * l.unitPricePiasters;
      this.arabicLine(l.name);
      this.arabicLine(`${toArabicIndic(l.qty)} × ${this.moneyPiasters(l.unitPricePiasters)} = ${this.moneyPiasters(lineTotal)}`);
    }
    this.arabicLine('--------------------------------');
    if (payload.discountPiasters && payload.discountPiasters > 0) {
      this.arabicLine(`خصم: -${this.moneyPiasters(payload.discountPiasters)}`);
    }
    if (payload.taxPiasters && payload.taxPiasters > 0) {
      this.arabicLine(`ضريبة: ${this.moneyPiasters(payload.taxPiasters)}`);
    }
    this.setEmphasis(true);
    this.arabicLine(`الإجمالي: ${this.moneyPiasters(payload.grandTotalPiasters)} EGP`);
    this.setEmphasis(false);
    if (payload.taxRegistrationNumber) {
      this.arabicLine(`الرقم الضريبي: ${payload.taxRegistrationNumber}`);
    }
    this.arabicLine(`الكاشير: ${payload.cashierId}`);
    this.feed(3).cut();
    return new Uint8Array(this.chunks);
  }
}

/** Convenience: render an Arabic RTL receipt payload to ESC/POS bytes. */
export function buildArabicReceiptBytes(payload: ReceiptPayload): Uint8Array {
  return new ArabicRtlReceiptTemplate().build(payload);
}
