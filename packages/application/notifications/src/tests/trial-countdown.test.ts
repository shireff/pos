import { describe, it, expect } from 'vitest';
import { TrialApproachingHandler } from '@packages/application-notifications';
import type { Clock } from '@packages/application-notifications';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Clock-simulation test for the trial countdown (TESTS.md trial-countdown).
 *
 * A single mutable clock drives the handler so the countdown can be advanced
 * without real-time waiting. Every device evaluates its own cached trialEndsAt
 * against local time (BR-NOT-007 / BR-LIC-008), so the same assertions hold
 * regardless of connectivity.
 */
describe('trial-countdown (clock simulation)', () => {
  // Mutable clock — `now` is reassigned to "advance" device time.
  let now = new Date('2026-01-01T00:00:00.000Z');
  const clock: Clock = { now: () => now };
  const handler = new TrialApproachingHandler(clock);

  function trialEndsAtIn(days: number): string {
    return new Date(now.getTime() + days * DAY_MS).toISOString();
  }

  it('fires a HIGH notification at trial day 10', () => {
    now = new Date('2026-01-01T00:00:00.000Z');
    const result = handler.classify(trialEndsAtIn(10));
    expect(result.shouldFire).toBe(true);
    expect(result.daysRemaining).toBe(10);
    expect(result.priority).toBe('HIGH');
    expect(result.triggerCode).toBe('TRIAL_APPROACHING_10');
  });

  it('fires a HIGH notification at trial day 7', () => {
    now = new Date('2026-01-01T00:00:00.000Z');
    const result = handler.classify(trialEndsAtIn(7));
    expect(result.shouldFire).toBe(true);
    expect(result.daysRemaining).toBe(7);
    expect(result.priority).toBe('HIGH');
    expect(result.triggerCode).toBe('TRIAL_APPROACHING_7');
  });

  it('fires a CRITICAL notification at trial day 13 (final reminder)', () => {
    now = new Date('2026-01-01T00:00:00.000Z');
    const result = handler.classify(trialEndsAtIn(13));
    expect(result.shouldFire).toBe(true);
    expect(result.daysRemaining).toBe(13);
    expect(result.priority).toBe('CRITICAL');
    expect(result.triggerCode).toBe('TRIAL_APPROACHING_13');
  });

  it('fires a CRITICAL "ending today" notification at trial day 1', () => {
    now = new Date('2026-01-01T00:00:00.000Z');
    const result = handler.classify(trialEndsAtIn(1));
    expect(result.shouldFire).toBe(true);
    expect(result.daysRemaining).toBe(1);
    expect(result.priority).toBe('CRITICAL');
    expect(result.triggerCode).toBe('TRIAL_ENDING_TODAY');
  });

  it('does NOT fire once the trial has expired (handled by TrialExpiredHandler)', () => {
    now = new Date('2026-01-15T00:00:00.000Z');
    // trialEndsAt is in the past relative to the clock
    const result = handler.classify(new Date('2026-01-10T00:00:00.000Z').toISOString());
    expect(result.shouldFire).toBe(false);
    expect(result.priority).toBe('CRITICAL');
    expect(result.triggerCode).toBe('TRIAL_EXPIRED');
  });

  it('advances the clock identically across evaluations (offline parity)', () => {
    // Start at day 13 from the device perspective.
    now = new Date('2026-01-01T00:00:00.000Z');
    let result = handler.classify(trialEndsAtIn(13));
    expect(result.priority).toBe('CRITICAL');
    expect(result.triggerCode).toBe('TRIAL_APPROACHING_13');

    // Advance the device clock by 3 days → now day 10.
    now = new Date(now.getTime() + 3 * DAY_MS);
    result = handler.classify(trialEndsAtIn(10));
    expect(result.priority).toBe('HIGH');
    expect(result.triggerCode).toBe('TRIAL_APPROACHING_10');

    // Advance another 9 days → 1 day remaining → critical ending today.
    now = new Date(now.getTime() + 9 * DAY_MS);
    result = handler.classify(trialEndsAtIn(1));
    expect(result.priority).toBe('CRITICAL');
    expect(result.triggerCode).toBe('TRIAL_ENDING_TODAY');

    // Advance past expiry → no longer fires from this handler.
    now = new Date(now.getTime() + 2 * DAY_MS);
    result = handler.classify(trialEndsAtIn(-1));
    expect(result.shouldFire).toBe(false);
  });

  it('evaluates identically from a completely offline device with only cached trialEndsAt', () => {
    // No event bus, no network — just the cached value and local time.
    const cachedTrialEndsAt = '2026-02-01T00:00:00.000Z';
    const offlineClock: Clock = { now: () => new Date('2026-01-22T00:00:00.000Z') }; // 10 days before
    const offlineHandler = new TrialApproachingHandler(offlineClock);
    const result = offlineHandler.classify(cachedTrialEndsAt);
    expect(result.shouldFire).toBe(true);
    expect(result.daysRemaining).toBe(10);
    expect(result.priority).toBe('HIGH');
  });
});
