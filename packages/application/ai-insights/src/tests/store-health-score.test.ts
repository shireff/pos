import { describe, it, expect, vi } from 'vitest';
import { StoreHealthScoreFeature } from '../features/store-health-score.feature';
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

describe('StoreHealthScoreFeature', () => {
  it('each sub-score is computed deterministically', async () => {
    const provider = createMockProvider();
    const feature = new StoreHealthScoreFeature(provider);

    const result = await feature.execute({
      companyId: 'c1',
      branchId: null,
      kpis: {
        sales: { score: 80, data: {} },
        inventory: { score: 70, data: {} },
        financial: { score: 90, data: {} },
        employee: { score: 60, data: {} },
        customer: { score: 75, data: {} },
      },
    });

    expect(result.subScores.sales).toBe(80);
    expect(result.subScores.inventory).toBe(70);
    expect(result.subScores.financial).toBe(90);
    expect(result.subScores.employee).toBe(60);
    expect(result.subScores.customer).toBe(75);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('LLM generates only narrative summary and top-3 recommendations', async () => {
    const provider = createMockProvider();
    const feature = new StoreHealthScoreFeature(provider);

    const result = await feature.execute({
      companyId: 'c1',
      branchId: null,
      kpis: {
        sales: { score: 80, data: {} },
        inventory: { score: 70, data: {} },
        financial: { score: 90, data: {} },
        employee: { score: 60, data: {} },
        customer: { score: 75, data: {} },
      },
    });

    expect(typeof result.narrativeSummary).toBe('string');
    expect(result.narrativeSummary.length).toBeGreaterThan(0);
    expect(Array.isArray(result.topRecommendations)).toBe(true);
    expect(result.topRecommendations.length).toBeLessThanOrEqual(3);
  });

  it('degrades gracefully when a sub-score data is unavailable', async () => {
    const provider = createMockProvider();
    const feature = new StoreHealthScoreFeature(provider);

    const result = await feature.execute({
      companyId: 'c1',
      branchId: null,
      kpis: {
        sales: { score: 80, data: {} },
        inventory: { score: 0, data: {} },
        financial: { score: 90, data: {} },
        employee: { score: 0, data: {} },
        customer: { score: 75, data: {} },
      },
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.subScores.sales).toBe(80);
  });
});
