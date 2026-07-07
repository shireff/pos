import { describe, expect, it } from 'vitest';
import { subscriptionReducer, setSubscriptionState } from './subscription-store';

describe('subscription store', () => {
  it('stores subscription state and read-only flags', () => {
    const state = subscriptionReducer(
      undefined,
      setSubscriptionState({
        status: 'trialing',
        trialEndsAt: '2026-07-20T12:00:00.000Z',
        planId: 'basic',
        isReadOnlyLocked: true,
        isFullAccessOverride: false,
      }),
    );

    expect(state.status).toBe('trialing');
    expect(state.trialEndsAt).toBe('2026-07-20T12:00:00.000Z');
    expect(state.planId).toBe('basic');
    expect(state.isReadOnlyLocked).toBe(true);
    expect(state.isFullAccessOverride).toBe(false);
  });
});
