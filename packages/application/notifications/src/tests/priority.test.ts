import { describe, it, expect } from 'vitest';
import {
  decideRouting,
  isNeverBatched,
  isExemptFromCap,
} from '@packages/application-notifications';

describe('priority gate', () => {
  it('CRITICAL is never batched: immediate, bypasses rate limit and digest', () => {
    const r = decideRouting('CRITICAL', 'INVENTORY');
    expect(r.immediate).toBe(true);
    expect(r.bypassesRateLimit).toBe(true);
    expect(r.digestFrequency).toBeNull();
    expect(isNeverBatched('CRITICAL', 'INVENTORY')).toBe(true);
  });

  it('HIGH is never batched: immediate, but counts toward the rate limit (unless exempt)', () => {
    const inventory = decideRouting('HIGH', 'INVENTORY');
    expect(inventory.immediate).toBe(true);
    expect(inventory.bypassesRateLimit).toBe(false);
    expect(inventory.digestFrequency).toBeNull();
    expect(isNeverBatched('HIGH', 'INVENTORY')).toBe(true);
  });

  it('MEDIUM (Normal) is batched into the hourly digest and never immediate', () => {
    const r = decideRouting('MEDIUM', 'GENERAL');
    expect(r.immediate).toBe(false);
    expect(r.bypassesRateLimit).toBe(false);
    expect(r.digestFrequency).toBe('HOURLY');
    expect(isNeverBatched('MEDIUM', 'GENERAL')).toBe(false);
  });

  it('LOW is batched into the daily digest only', () => {
    const r = decideRouting('LOW', 'GENERAL');
    expect(r.immediate).toBe(false);
    expect(r.bypassesRateLimit).toBe(false);
    expect(r.digestFrequency).toBe('DAILY');
    expect(isNeverBatched('LOW', 'GENERAL')).toBe(false);
  });

  it('BILLING_TRIAL is exempt from the daily cap (never rate-limited, BR-NOT-004)', () => {
    // Even at LOW priority the category bypasses the rate limiter.
    const low = decideRouting('LOW', 'BILLING_TRIAL');
    expect(low.bypassesRateLimit).toBe(true);
    expect(isExemptFromCap('BILLING_TRIAL')).toBe(true);

    const high = decideRouting('HIGH', 'BILLING_TRIAL');
    expect(high.bypassesRateLimit).toBe(true);
  });

  it('non-exempt categories are NOT cap-exempt', () => {
    expect(isExemptFromCap('INVENTORY')).toBe(false);
    expect(isExemptFromCap('GENERAL')).toBe(false);
    expect(decideRouting('LOW', 'GENERAL').bypassesRateLimit).toBe(false);
  });

  it('Critical/High safety notifications cannot be suppressed by user preference (BR-NOT-003)', () => {
    // The routing gate keeps them immediate + individual. Preference checks at
    // delivery time may only mute the channel, never the in-app record.
    const safetyCategories = ['INVENTORY', 'SYNC', 'BILLING_TRIAL', 'SECURITY'] as const;
    for (const category of safetyCategories) {
      expect(decideRouting('CRITICAL', category).immediate).toBe(true);
      expect(decideRouting('HIGH', category).immediate).toBe(true);
    }
  });
});
