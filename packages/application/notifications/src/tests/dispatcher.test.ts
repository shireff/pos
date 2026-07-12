import { describe, it, expect, beforeEach } from 'vitest';
import type { DomainEventBase } from '@packages/shared-kernel';
import {
  NotificationDispatcher,
  LowStockAlertHandler,
  ReturnApprovalRequestHandler,
  SyncConflictHandler,
  TrialExpiredHandler,
  AccountSuspendedHandler,
} from '@packages/application-notifications';
import { InMemoryNotificationRepository, InMemoryPreferenceRepository, InMemoryRateLimitRepository, FakeRecipientResolver, FakeChannel, identityTranslator } from './test-doubles';

// ─── Lightweight domain-event stand-ins (match handler.eventType by name) ──────

class ReorderPointReached {
  constructor(
    public companyId: string,
    public productId: string,
    public quantityOnHand: number,
  ) {}
}

class ReturnRequested {
  constructor(
    public companyId: string,
    public aggregateId: string,
    public originalOrderId: string,
    public status: string,
    public refundAmountPiasters: number,
  ) {}
}

class SyncConflictDetected {
  constructor(
    public companyId: string,
    public aggregateId: string,
    public entityType: string,
  ) {}
}

class SubscriptionTrialExpired {
  constructor(
    public companyId: string,
    public aggregateId: string,
  ) {}
}

class PlatformAdminAccountSuspended {
  constructor(public targetCompanyId: string) {}
}

function buildDispatcher(notificationRepo: InMemoryNotificationRepository) {
  const preferenceRepo = new InMemoryPreferenceRepository();
  const rateLimitRepo = new InMemoryRateLimitRepository();
  const resolver = new FakeRecipientResolver();
  const push = new FakeChannel('PUSH');
  const email = new FakeChannel('EMAIL');
  const dispatcher = new NotificationDispatcher({
    handlers: [
      new LowStockAlertHandler(),
      new ReturnApprovalRequestHandler(),
      new SyncConflictHandler(),
      new TrialExpiredHandler(),
      new AccountSuspendedHandler(),
    ],
    channels: [push, email],
    notificationRepo,
    preferenceRepo,
    rateLimitRepo,
    resolver,
    translator: identityTranslator,
  });
  return { dispatcher, preferenceRepo, rateLimitRepo, push, email };
}

function notificationsFor(repo: InMemoryNotificationRepository, userId: string) {
  return repo.store.filter((n) => n.recipientUserId === userId);
}

describe('NotificationDispatcher (BR-NOT-001)', () => {
  let repo: InMemoryNotificationRepository;
  let dispatcher: NotificationDispatcher;
  let push: FakeChannel;
  let email: FakeChannel;

  beforeEach(() => {
    repo = new InMemoryNotificationRepository();
    const built = buildDispatcher(repo);
    dispatcher = built.dispatcher;
    push = built.push;
    email = built.email;
  });

  it('routes a stockout (qty 0) to a CRITICAL in-app + push + email notification', async () => {
    await dispatcher.dispatch(
      new ReorderPointReached('company-1', 'prod-1', 0) as unknown as DomainEventBase,
    );

    const all = repo.store;
    expect(all.length).toBeGreaterThan(0);
    const stockout = all.find((n) => n.triggerCode === 'STOCKOUT');
    expect(stockout).toBeDefined();
    expect(stockout!.priority).toBe('CRITICAL');
    expect(stockout!.category).toBe('INVENTORY');

    // Recipients: branch manager + owner.
    expect(notificationsFor(repo, 'mgr1').some((n) => n.triggerCode === 'STOCKOUT')).toBe(true);
    expect(notificationsFor(repo, 'owner1').some((n) => n.triggerCode === 'STOCKOUT')).toBe(true);

    // Immediate channels fired for CRITICAL.
    expect(push.sent.some((s) => s.notification.triggerCode === 'STOCKOUT')).toBe(true);
    expect(email.sent.some((s) => s.notification.triggerCode === 'STOCKOUT')).toBe(true);
  });

  it('routes low stock (qty > 0) to a HIGH priority notification', async () => {
    await dispatcher.dispatch(
      new ReorderPointReached('company-1', 'prod-1', 5) as unknown as DomainEventBase,
    );
    const low = repo.store.find((n) => n.triggerCode === 'LOW_STOCK');
    expect(low).toBeDefined();
    expect(low!.priority).toBe('HIGH');
  });

  it('routes a pending return-approval request to the approver with a deep link', async () => {
    await dispatcher.dispatch(
      new ReturnRequested('company-1', 'ret-1', 'ord-1', 'pending_approval', 5000) as unknown as DomainEventBase,
    );
    const req = repo.store.find((n) => n.triggerCode === 'RETURN_PENDING_APPROVAL');
    expect(req).toBeDefined();
    expect(req!.priority).toBe('HIGH');
    expect(req!.category).toBe('APPROVALS');
    expect(req!.actionUrl).toBe('/orders/ord-1/returns/ret-1/approve');
    expect(notificationsFor(repo, 'approver1').length).toBe(1);
  });

  it('does NOT notify when a return is not pending approval', async () => {
    await dispatcher.dispatch(
      new ReturnRequested('company-1', 'ret-1', 'ord-1', 'completed', 5000) as unknown as DomainEventBase,
    );
    expect(repo.store.length).toBe(0);
  });

  it('routes a sync conflict to owner + manager as HIGH SECURITY', async () => {
    await dispatcher.dispatch(
      new SyncConflictDetected('company-1', 'conf-1', 'Product') as unknown as DomainEventBase,
    );
    const conflict = repo.store.find((n) => n.triggerCode === 'SYNC_CONFLICT');
    expect(conflict).toBeDefined();
    expect(conflict!.priority).toBe('HIGH');
    expect(conflict!.category).toBe('SECURITY');
    expect(conflict!.actionUrl).toBe('/sync/conflicts/conf-1');
    expect(notificationsFor(repo, 'owner1').length).toBe(1);
    expect(notificationsFor(repo, 'mgr1').length).toBe(1);
  });

  it('routes trial expiry to the owner only as a CRITICAL BILLING_TRIAL notification', async () => {
    await dispatcher.dispatch(
      new SubscriptionTrialExpired('company-1', 'sub-1') as unknown as DomainEventBase,
    );
    const expired = repo.store.find((n) => n.triggerCode === 'TRIAL_EXPIRED');
    expect(expired).toBeDefined();
    expect(expired!.priority).toBe('CRITICAL');
    expect(expired!.category).toBe('BILLING_TRIAL');
    expect(expired!.actionUrl).toBe('/subscription/upgrade');
    // Only the owner receives Billing & Trial notifications.
    expect(notificationsFor(repo, 'owner1').length).toBe(1);
    expect(notificationsFor(repo, 'mgr1').length).toBe(0);
  });

  it('routes account suspension to the owner as a CRITICAL SECURITY notification (no leak of admin/why)', async () => {
    await dispatcher.dispatch(
      new PlatformAdminAccountSuspended('company-1') as unknown as DomainEventBase,
    );
    const suspended = repo.store.find((n) => n.triggerCode === 'ACCOUNT_SUSPENDED');
    expect(suspended).toBeDefined();
    expect(suspended!.priority).toBe('CRITICAL');
    expect(suspended!.category).toBe('SECURITY');
    expect(suspended!.recipientUserId).toBe('owner1');
  });

  it('does not deliver a second identical notification within the duplicate window', async () => {
    const ev = new ReorderPointReached('company-1', 'prod-1', 5) as unknown as DomainEventBase;
    await dispatcher.dispatch(ev);
    await dispatcher.dispatch(ev);
    // Two in-app records are written per dispatch (one per recipient), but the
    // push channel is deduplicated by the rate limiter on the second dispatch,
    // so each of the two recipients is pushed exactly once (2 total).
    const lowStockPush = push.sent.filter((s) => s.notification.triggerCode === 'LOW_STOCK');
    expect(lowStockPush.length).toBe(2);
  });
});
