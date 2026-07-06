import { DomainEventBase } from '@packages/shared-kernel';

export class SubscriptionTrialStarted extends DomainEventBase {
  public readonly companyId: string;
  public readonly trialEndsAt: string;

  public constructor(props: { subscriptionId: string; companyId: string; trialEndsAt: string }) {
    super(props.subscriptionId, 'Subscription');
    this.companyId = props.companyId;
    this.trialEndsAt = props.trialEndsAt;
  }
}

export class SubscriptionActivated extends DomainEventBase {
  public readonly companyId: string;
  public readonly planId: string;

  public constructor(props: { subscriptionId: string; companyId: string; planId: string }) {
    super(props.subscriptionId, 'Subscription');
    this.companyId = props.companyId;
    this.planId = props.planId;
  }
}

export class SubscriptionTrialExpired extends DomainEventBase {
  public readonly companyId: string;

  public constructor(props: { subscriptionId: string; companyId: string }) {
    super(props.subscriptionId, 'Subscription');
    this.companyId = props.companyId;
  }
}

export class SubscriptionLocked extends DomainEventBase {
  public readonly companyId: string;
  public readonly lockReason: string;

  public constructor(props: { subscriptionId: string; companyId: string; lockReason: string }) {
    super(props.subscriptionId, 'Subscription');
    this.companyId = props.companyId;
    this.lockReason = props.lockReason;
  }
}

export class SubscriptionPastDue extends DomainEventBase {
  public readonly companyId: string;

  public constructor(props: { subscriptionId: string; companyId: string }) {
    super(props.subscriptionId, 'Subscription');
    this.companyId = props.companyId;
  }
}
