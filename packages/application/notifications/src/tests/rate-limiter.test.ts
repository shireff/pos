import { describe, it, expect } from 'vitest';
import { RateLimiter, DEFAULT_RATE_LIMIT_CONFIG } from '@packages/application-notifications';
import { InMemoryRateLimitRepository } from './test-doubles';

const now = new Date('2026-01-01T00:00:00.000Z');

describe('rate limiter', () => {
  it('suppresses an identical key within the duplicate window', async () => {
    const repo = new InMemoryRateLimitRepository();
    const limiter = new RateLimiter(repo, DEFAULT_RATE_LIMIT_CONFIG);

    const first = await limiter.evaluate('user-1', 'INVENTORY', 'LOW_STOCK:prod-1', now);
    expect(first.allowed).toBe(true);
    expect(first.duplicate).toBe(false);

    // Same (user, category, key) a moment later → duplicate suppression.
    const second = await limiter.evaluate(
      'user-1',
      'INVENTORY',
      'LOW_STOCK:prod-1',
      new Date(now.getTime() + 1000),
    );
    expect(second.duplicate).toBe(true);
    expect(second.allowed).toBe(false);
  });

  it('does NOT suppress different keys within the window', async () => {
    const repo = new InMemoryRateLimitRepository();
    const limiter = new RateLimiter(repo, DEFAULT_RATE_LIMIT_CONFIG);

    await limiter.evaluate('user-1', 'INVENTORY', 'LOW_STOCK:prod-1', now);
    const other = await limiter.evaluate('user-1', 'INVENTORY', 'LOW_STOCK:prod-2', now);
    expect(other.duplicate).toBe(false);
    expect(other.allowed).toBe(true);
  });

  it('folds into a summary once the daily cap is reached', async () => {
    const repo = new InMemoryRateLimitRepository();
    const limiter = new RateLimiter(repo, { ...DEFAULT_RATE_LIMIT_CONFIG, dailyCap: 2 });

    const r1 = await limiter.evaluate('user-1', 'INVENTORY', 'k1', now);
    const r2 = await limiter.evaluate('user-1', 'INVENTORY', 'k2', now);
    expect(r1.capReached).toBe(false);
    expect(r2.capReached).toBe(false);

    const r3 = await limiter.evaluate('user-1', 'INVENTORY', 'k3', now);
    expect(r3.capReached).toBe(true);
    expect(r3.allowed).toBe(false);
  });

  it('resets the cap for a new day (window expiry)', async () => {
    const repo = new InMemoryRateLimitRepository();
    const limiter = new RateLimiter(repo, { ...DEFAULT_RATE_LIMIT_CONFIG, dailyCap: 1 });

    const today = await limiter.evaluate('user-1', 'INVENTORY', 'k1', now);
    expect(today.capReached).toBe(false);

    const nextDay = await limiter.evaluate(
      'user-1',
      'INVENTORY',
      'k2',
      new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    );
    expect(nextDay.capReached).toBe(false);
  });
});
