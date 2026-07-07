import { describe, expect, it } from 'vitest';
import { checkSelfLock } from './self-lock.command';

describe('checkSelfLock', () => {
  it('locks locally when the cached trial has expired', () => {
    const now = new Date('2026-07-20T12:00:00.000Z');

    const result = checkSelfLock(
      {
        status: 'trialing',
        trialEndsAt: '2026-07-15T12:00:00.000Z',
        planId: null,
      },
      now,
    );

    expect(result.isLocked).toBe(true);
    expect(result.lockReason).toBe('trial_expired');
    expect(result.remainingMs).toBe(0);
  });
});
