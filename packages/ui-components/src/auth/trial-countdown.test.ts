import { describe, expect, it } from 'vitest';
import { getTrialCountdownState } from './trial-countdown';

describe('getTrialCountdownState', () => {
  it('returns a warning state for the last 10 days of the trial', () => {
    const now = new Date('2026-07-01T12:00:00.000Z');
    const trialEndsAt = new Date('2026-07-09T12:00:00.000Z');

    const result = getTrialCountdownState(trialEndsAt, now);

    expect(result.isVisible).toBe(true);
    expect(result.isCritical).toBe(true);
    expect(result.daysRemaining).toBe(8);
  });

  it('returns an expired state once the trial has ended', () => {
    const now = new Date('2026-07-20T12:00:00.000Z');
    const trialEndsAt = new Date('2026-07-15T12:00:00.000Z');

    const result = getTrialCountdownState(trialEndsAt, now);

    expect(result.isVisible).toBe(false);
    expect(result.isExpired).toBe(true);
  });
});
