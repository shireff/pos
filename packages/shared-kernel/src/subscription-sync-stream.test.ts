import { describe, expect, it } from 'vitest';
import {
  SubscriptionSyncStream,
  createSubscriptionStatusChangeEvent,
} from './subscription-sync-stream';

describe('SubscriptionSyncStream', () => {
  it('publishes a status change to every registered device listener', () => {
    const stream = new SubscriptionSyncStream();
    const receivedEvents: Array<{ companyId: string; status: string }> = [];

    stream.subscribe('device-a', (event) => {
      receivedEvents.push({ companyId: event.companyId, status: event.status });
    });
    stream.subscribe('device-b', (event) => {
      receivedEvents.push({ companyId: event.companyId, status: event.status });
    });

    stream.publish(
      createSubscriptionStatusChangeEvent({
        companyId: 'company-1',
        status: 'suspended',
        trialEndsAt: '2026-07-08T12:00:00.000Z',
      }),
    );

    expect(receivedEvents).toEqual([
      { companyId: 'company-1', status: 'suspended' },
      { companyId: 'company-1', status: 'suspended' },
    ]);
  });
});
