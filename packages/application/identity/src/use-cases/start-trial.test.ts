import { describe, it, expect, vi } from 'vitest';
import { StartTrial } from './start-trial';
import type { SubscriptionRepository } from '../ports';

describe('StartTrial', () => {
  it('creates a trial subscription for a company', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const subscriptions = {
      save,
    };

    const useCase = new StartTrial(subscriptions as SubscriptionRepository);
    const result = await useCase.execute({ companyId: 'company-1' });

    expect(result.subscription.status).toBe('trial');
    expect(result.subscription.companyId).toBe('company-1');
    expect(save).toHaveBeenCalledTimes(1);
  });
});
