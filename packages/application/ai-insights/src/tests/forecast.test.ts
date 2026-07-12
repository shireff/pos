import { describe, it, expect, vi } from 'vitest';
import { SalesPredictionFeature } from '../features/sales-prediction.feature';
import { InventoryPredictionFeature } from '../features/inventory-prediction.feature';
import type { IAIProvider } from '@packages/application-ai';

function createMockProvider(): IAIProvider {
  return {
    complete: vi.fn().mockResolvedValue({
      text: 'Mock narrative',
      tokensUsed: 10,
      model: 'local',
      source: 'local',
    }),
    embed: vi.fn().mockResolvedValue({ embedding: [], model: 'local', source: 'local' }),
    classify: vi.fn().mockResolvedValue({ category: 'mock', confidence: 0.9 }),
    isAvailable: vi.fn().mockResolvedValue(true),
  };
}

describe('AI forecast determinism', () => {
  it('identical input produces identical numeric output for sales prediction', async () => {
    const provider = createMockProvider();
    const feature = new SalesPredictionFeature(provider);
    const data = [
      { date: '2024-01-01', revenue: 1000 },
      { date: '2024-01-02', revenue: 1200 },
      { date: '2024-01-03', revenue: 1100 },
    ];

    const result1 = await feature.execute({
      companyId: 'c1',
      branchId: null,
      historicalData: data,
      horizon: 'week',
    });
    const result2 = await feature.execute({
      companyId: 'c1',
      branchId: null,
      historicalData: data,
      horizon: 'week',
    });

    expect(result1.deterministicValue).toBe(result2.deterministicValue);
    expect(typeof result1.deterministicValue).toBe('number');
  });

  it('identical input produces identical numeric output for inventory prediction', async () => {
    const provider = createMockProvider();
    const feature = new InventoryPredictionFeature(provider);
    const data = [
      { date: '2024-01-01', quantity: 10 },
      { date: '2024-01-02', quantity: 12 },
    ];

    const result1 = await feature.execute({
      companyId: 'c1',
      branchId: null,
      stockMovements: data,
      productId: 'p1',
    });
    const result2 = await feature.execute({
      companyId: 'c1',
      branchId: null,
      stockMovements: data,
      productId: 'p1',
    });

    expect(result1.deterministicValue).toBe(result2.deterministicValue);
  });

  it('LLM narrative text is schema-validated', async () => {
    const provider = createMockProvider();
    const feature = new SalesPredictionFeature(provider);

    const result = await feature.execute({
      companyId: 'c1',
      branchId: null,
      historicalData: [{ date: '2024-01-01', revenue: 1000 }],
      horizon: 'week',
    });

    expect(typeof result.narrativeText).toBe('string');
    expect(result.narrativeText.length).toBeGreaterThan(0);
  });
});
