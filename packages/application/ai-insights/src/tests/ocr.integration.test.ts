import { describe, it, expect, vi } from 'vitest';
import { OcrFeature } from '../features/ocr.feature';
import type { IAIProvider } from '@packages/application-ai';

function createMockProvider(overrides: { complete?: { text: string } } = {}): IAIProvider {
  return {
    complete: vi.fn().mockResolvedValue({
      text: overrides.complete?.text ?? '{"supplier":"Acme","date":"2024-01-01","lineItems":[{"description":"Item 1","quantity":1,"unitPrice":100,"total":100}],"subtotal":100,"tax":14,"total":114}',
      tokensUsed: 10,
      model: 'local',
      source: 'local',
    }),
    embed: vi.fn().mockResolvedValue({ embedding: [], model: 'local', source: 'local' }),
    classify: vi.fn().mockResolvedValue({ category: 'mock', confidence: 0.9 }),
    isAvailable: vi.fn().mockResolvedValue(true),
  };
}

describe('OcrFeature integration', () => {
  it('returns extracted fields as structured JSON', async () => {
    const provider = createMockProvider();
    const feature = new OcrFeature(provider);

    const result = await feature.execute({
      companyId: 'c1',
      userId: 'u1',
      imageReference: 'invoice-123',
    });

    expect(result.extracted.supplier).toBe('Acme');
    expect(result.extracted.total).toBe(114);
    expect(result.extracted.lineItems.length).toBe(1);
  });

  it('never auto-commits OCR result to supplier_invoices', async () => {
    const provider = createMockProvider();
    const feature = new OcrFeature(provider);

    const result = await feature.execute({
      companyId: 'c1',
      userId: 'u1',
      imageReference: 'invoice-123',
    });

    expect(result.recommendation.state).toBe('generated');
    expect(result.recommendation.payload).toBeDefined();
  });

  it('handles malformed OCR response gracefully', async () => {
    const provider = createMockProvider();
    provider.complete = vi.fn().mockResolvedValue({
      text: 'not valid json',
      tokensUsed: 10,
      model: 'local',
      source: 'local',
    });
    const feature = new OcrFeature(provider);

    const result = await feature.execute({
      companyId: 'c1',
      userId: 'u1',
      imageReference: 'invoice-123',
    });

    expect(result.extracted.supplier).toBe('');
    expect(result.extracted.lineItems.length).toBe(0);
  });
});
