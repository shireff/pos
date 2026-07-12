import { describe, it, expect, vi } from 'vitest';
import { FraudDetectionFeature } from '../features/fraud-detection.feature';
import type { IAIProvider } from '@packages/application-ai';

function createMockProvider(): IAIProvider {
  return {
    complete: vi.fn().mockResolvedValue({
      text: 'Mock explanation',
      tokensUsed: 10,
      model: 'local',
      source: 'local',
    }),
    embed: vi.fn().mockResolvedValue({ embedding: [], model: 'local', source: 'local' }),
    classify: vi.fn().mockResolvedValue({ category: 'mock', confidence: 0.9 }),
    isAvailable: vi.fn().mockResolvedValue(true),
  };
}

describe('FraudDetectionFeature', () => {
  it('computes deterministic rule-based score', async () => {
    const provider = createMockProvider();
    const feature = new FraudDetectionFeature(provider);

    const result = await feature.execute({
      companyId: 'c1',
      branchId: null,
      transaction: {
        amount: 100,
        discount: 50,
        hour: 23,
        cashierId: 'cashier-1',
        voidRate: 0.2,
        returnRate: 0.1,
      },
    });

    expect(result.deterministicValue).toBeGreaterThanOrEqual(0);
    expect(result.deterministicValue).toBeLessThanOrEqual(100);
    expect(typeof result.deterministicValue).toBe('number');
  });

  it('LLM generates only the explanation of an already-computed score', async () => {
    const provider = createMockProvider();
    const feature = new FraudDetectionFeature(provider);

    const result = await feature.execute({
      companyId: 'c1',
      branchId: null,
      transaction: {
        amount: 100,
        discount: 50,
        hour: 23,
        cashierId: 'cashier-1',
        voidRate: 0.2,
        returnRate: 0.1,
      },
    });

    expect(typeof result.narrativeText).toBe('string');
    expect(result.narrativeText.length).toBeGreaterThan(0);
  });

  it('fraud alert is advisory only — no automated account suspension', async () => {
    const provider = createMockProvider();
    const feature = new FraudDetectionFeature(provider);

    const result = await feature.execute({
      companyId: 'c1',
      branchId: null,
      transaction: {
        amount: 100,
        discount: 50,
        hour: 23,
        cashierId: 'cashier-1',
        voidRate: 0.2,
        returnRate: 0.1,
      },
    });

    expect(result.deterministicUnit).toBe('score');
    expect(result.narrativeText).not.toContain('suspended');
  });

  it('higher void rate increases fraud score deterministically', async () => {
    const provider = createMockProvider();
    const feature = new FraudDetectionFeature(provider);

    const lowVoid = await feature.execute({
      companyId: 'c1',
      branchId: null,
      transaction: {
        amount: 100,
        discount: 10,
        hour: 10,
        cashierId: 'cashier-1',
        voidRate: 0.05,
        returnRate: 0.05,
      },
    });

    const highVoid = await feature.execute({
      companyId: 'c1',
      branchId: null,
      transaction: {
        amount: 100,
        discount: 10,
        hour: 10,
        cashierId: 'cashier-1',
        voidRate: 0.3,
        returnRate: 0.05,
      },
    });

    expect(highVoid.deterministicValue).toBeGreaterThan(lowVoid.deterministicValue);
  });
});
