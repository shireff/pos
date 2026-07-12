import { describe, it, expect, vi } from 'vitest';
import { AIGateway } from './ai-gateway';
import type { IAIProvider, CompletionResult } from '@packages/application-ai';

function createMockProvider(overrides: Partial<IAIProvider> = {}): IAIProvider {
  return {
    complete: vi.fn().mockResolvedValue({
      text: 'Mock response',
      tokensUsed: 10,
      model: 'mock',
      source: 'local',
    } as CompletionResult),
    embed: vi.fn().mockResolvedValue({
      embedding: [],
      model: 'mock',
      source: 'local',
    }),
    classify: vi.fn().mockResolvedValue({
      category: 'mock',
      confidence: 0.9,
    }),
    isAvailable: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe('AIGateway local-only routing', () => {
  it('routes all complete requests to local provider', async () => {
    const local = createMockProvider({
      complete: vi.fn().mockResolvedValue({
        text: 'Local response',
        tokensUsed: 5,
        model: 'local',
        source: 'local',
      } as CompletionResult),
    });

    const gateway = new AIGateway({ localProvider: local });

    const result = await gateway.complete({ prompt: 'test' });

    expect(result.source).toBe('local');
    expect(result.text).toBe('Local response');
    expect(local.complete).toHaveBeenCalledTimes(1);
  });

  it('routes all embed requests to local provider', async () => {
    const local = createMockProvider({
      embed: vi.fn().mockResolvedValue({
        embedding: [0.1, 0.2],
        model: 'local',
        source: 'local',
      }),
    });

    const gateway = new AIGateway({ localProvider: local });

    const result = await gateway.embed('test text');

    expect(result.source).toBe('local');
    expect(local.embed).toHaveBeenCalledTimes(1);
  });

  it('routes all classify requests to local provider', async () => {
    const local = createMockProvider({
      classify: vi.fn().mockResolvedValue({
        category: 'sales',
        confidence: 0.9,
      }),
    });

    const gateway = new AIGateway({ localProvider: local });

    const result = await gateway.classify({ text: 'test', categories: ['sales', 'inventory'] });

    expect(result.category).toBe('sales');
    expect(local.classify).toHaveBeenCalledTimes(1);
  });

  it('propagates local provider errors', async () => {
    const local = createMockProvider({
      complete: vi.fn().mockRejectedValue(new Error('Local model unavailable')),
    });

    const gateway = new AIGateway({ localProvider: local });

    await expect(gateway.complete({ prompt: 'test' })).rejects.toThrow('Local model unavailable');
  });

  it('logs routing decisions', async () => {
    const local = createMockProvider();
    const logs: Array<{ source: string; success: boolean }> = [];
    const routingLog = {
      log: vi.fn((entry) => logs.push({ source: entry.source, success: entry.success })),
      getLogs: vi.fn(),
      clear: vi.fn(),
    };

    const gateway = new AIGateway({
      localProvider: local,
      routingLog: routingLog as any,
    });

    await gateway.complete({ prompt: 'test' });

    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs.every((l) => l.source === 'local')).toBe(true);
  });
});
