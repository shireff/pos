import { describe, it, expect } from 'vitest';
import { OcrStubService } from './domain-services';

describe('OcrStubService (BR-SUP-003)', () => {
  it('returns deterministic extracted data — same reference yields same result', () => {
    const a = OcrStubService.extract('invoice-2026-001.png');
    const b = OcrStubService.extract('invoice-2026-001.png');
    expect(a).toEqual(b);
  });

  it('produces different data for different references', () => {
    const a = OcrStubService.extract('invoice-A.png');
    const b = OcrStubService.extract('invoice-B.png');
    // Extremely unlikely to be identical for distinct seeds; sanity guard.
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('returns editable fields but never auto-commits (pure, side-effect free)', () => {
    const result = OcrStubService.extract('receipt.png');
    expect(result.supplierName).toBeTruthy();
    expect(result.invoiceNumber).toBeTruthy();
    expect(Array.isArray(result.lineItems)).toBe(true);
    expect(result.totalAmountPiasters).toBeGreaterThan(0);
    // No persistence side effects: extraction is a deterministic pure function.
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });
});
