export interface SubscriptionStatusChangeEvent {
  type: 'subscription.status_changed';
  companyId: string;
  status:
    'trialing' | 'active' | 'past_due' | 'locked' | 'canceled' | 'suspended' | 'trial_expired';
  trialEndsAt: string | null;
  emittedAt: string;
}

export interface SubscriptionSyncListener {
  (event: SubscriptionStatusChangeEvent): void;
}

export class SubscriptionSyncStream {
  private readonly listeners = new Map<string, SubscriptionSyncListener>();

  public subscribe(deviceId: string, listener: SubscriptionSyncListener): void {
    this.listeners.set(deviceId, listener);
  }

  public unsubscribe(deviceId: string): void {
    this.listeners.delete(deviceId);
  }

  public publish(event: SubscriptionStatusChangeEvent): void {
    for (const listener of this.listeners.values()) {
      listener(event);
    }
  }
}

export function createSubscriptionStatusChangeEvent(props: {
  companyId: string;
  status: SubscriptionStatusChangeEvent['status'];
  trialEndsAt: string | null;
}): SubscriptionStatusChangeEvent {
  return {
    type: 'subscription.status_changed',
    companyId: props.companyId,
    status: props.status,
    trialEndsAt: props.trialEndsAt,
    emittedAt: new Date().toISOString(),
  };
}
