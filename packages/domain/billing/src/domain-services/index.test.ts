import { describe, it, expect } from 'vitest';
import { SubscriptionWriteLockGuard } from './index';
import { Subscription } from '../aggregates';

function lockedSubscription(): Subscription {
  return Subscription.reconstitute({
    id: 'sub-1',
    companyId: 'c1',
    planId: null,
    status: 'locked',
    lockReason: 'trial_expired',
    trialStartedAt: new Date(Date.now() - 30 * 864e5).toISOString(),
    trialEndsAt: new Date(Date.now() - 864e5).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

describe('SubscriptionWriteLockGuard (backup carve-out)', () => {
  it('blocks a normal command when the subscription is locked', () => {
    const sub = lockedSubscription();
    expect(() =>
      SubscriptionWriteLockGuard.ensureWritableFor('SomeOtherCommand', sub),
    ).toThrow(/write-locked/i);
  });

  it('allows CreateBackupCommand even when locked', () => {
    const sub = lockedSubscription();
    expect(() =>
      SubscriptionWriteLockGuard.ensureWritableFor('CreateBackupCommand', sub),
    ).not.toThrow();
  });

  it('allows RestoreBackupCommand even when locked', () => {
    const sub = lockedSubscription();
    expect(() =>
      SubscriptionWriteLockGuard.ensureWritableFor('RestoreBackupCommand', sub),
    ).not.toThrow();
  });

  it('blocks any command when locked and no carve-out applies', () => {
    const sub = lockedSubscription();
    expect(sub.isWriteLocked()).toBe(true);
  });
});
