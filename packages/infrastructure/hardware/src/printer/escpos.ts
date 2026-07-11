import type { ReceiptPayload } from './types';

/**
 * Builds ESC/POS command bytes for a thermal receipt printer.
 *
 * This is a pure function with no peripheral dependency so it can be unit-tested
 * against a simulated I/O double (Hardware.md §7). It emits:
 *   - initialize / reset
 *   - company + branch header (centered, emphasized)
 *   - order id + timestamp
 *   - one line per item (name, qty x unit price, line total)
 *   - discount, tax, and grand-total footer (emphasized)
 *   - a paper feed + full cut at the end.
 *
 * RTL/Arabic code-page selection is intentionally NOT handled here — the adapter
 * is responsible for switching code pages per printer capability (Hardware.md §2).
 */
export class EscPosBuilder {
  private readonly chunks: number[] = [];

  /** ESC @ — initialize printer. */
  public initialize(): this {
    this.chunks.push(0x1b, 0x40);
    return this;
  }

  /** ESC E n — emphasis on/off. */
  public setEmphasis(on: boolean): this {
    this.chunks.push(0x1b, 0x45, on ? 1 : 0);
    return this;
  }

  /** ESC a n — justification: 0 left, 1 center, 2 right. */
  public setJustify(mode: 0 | 1 | 2): this {
    this.chunks.push(0x1b, 0x61, mode);
    return this;
  }

  public text(value: string): this {
    for (let i = 0; i < value.length; i++) this.chunks.push(value.charCodeAt(i) & 0xff);
    return this;
  }

  public line(value = ''): this {
    return this.text(`${value}\n`);
  }

  public feed(lines: number): this {
    this.chunks.push(0x1b, 0x64, lines);
    return this;
  }

  /** GS V 0 — full cut. */
  public cut(): this {
    this.chunks.push(0x1d, 0x56, 0x00);
    return this;
  }

  public build(): Uint8Array {
    return new Uint8Array(this.chunks);
  }
}

function moneyLine(piasters: number): string {
  return (piasters / 100).toFixed(2);
}

/** Renders a ReceiptPayload into ESC/POS command bytes. */
export function buildReceiptBytes(payload: ReceiptPayload): Uint8Array {
  const b = new EscPosBuilder();
  b.initialize();

  b.setEmphasis(true).setJustify(1);
  b.line(payload.companyName);
  b.line(payload.branchName);
  b.setEmphasis(false).setJustify(0);
  b.line(`Order: ${payload.orderId}`);
  if (payload.createdAt) b.line(payload.createdAt);
  b.line('--------------------------------');
  for (const l of payload.lines) {
    const lineTotal = l.qty * l.unitPricePiasters;
    b.line(`${l.name}`);
    b.line(`  ${l.qty} x ${moneyLine(l.unitPricePiasters)} = ${moneyLine(lineTotal)}`);
  }
  b.line('--------------------------------');
  if (payload.discountPiasters && payload.discountPiasters > 0) {
    b.line(`Discount: -${moneyLine(payload.discountPiasters)}`);
  }
  if (payload.taxPiasters && payload.taxPiasters > 0) {
    b.line(`Tax: ${moneyLine(payload.taxPiasters)}`);
  }
  b.setEmphasis(true);
  b.line(`TOTAL: ${moneyLine(payload.grandTotalPiasters)} EGP`);
  b.setEmphasis(false);
  b.line(`Cashier: ${payload.cashierId}`);
  b.feed(3).cut();
  return b.build();
}
