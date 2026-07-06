import { DomainEventBase } from '@packages/shared-kernel';

export class PlatformAdminPlanChanged extends DomainEventBase {
  public readonly targetCompanyId: string;
  public readonly reason: string;
  public readonly newPlanId: string;

  public constructor(props: {
    actionId: string;
    targetCompanyId: string;
    reason: string;
    newPlanId: string;
  }) {
    super(props.actionId, 'PlatformAdminAction');
    this.targetCompanyId = props.targetCompanyId;
    this.reason = props.reason;
    this.newPlanId = props.newPlanId;
  }
}

export class PlatformAdminOverrideGranted extends DomainEventBase {
  public readonly targetCompanyId: string;
  public readonly reason: string;
  public readonly expiresAt: string | null;

  public constructor(props: {
    actionId: string;
    targetCompanyId: string;
    reason: string;
    expiresAt: string | null;
  }) {
    super(props.actionId, 'PlatformAdminAction');
    this.targetCompanyId = props.targetCompanyId;
    this.reason = props.reason;
    this.expiresAt = props.expiresAt;
  }
}

export class PlatformAdminOverrideRevoked extends DomainEventBase {
  public readonly targetCompanyId: string;
  public readonly reason: string;

  public constructor(props: { actionId: string; targetCompanyId: string; reason: string }) {
    super(props.actionId, 'PlatformAdminAction');
    this.targetCompanyId = props.targetCompanyId;
    this.reason = props.reason;
  }
}

export class PlatformAdminAccountSuspended extends DomainEventBase {
  public readonly targetCompanyId: string;
  public readonly reason: string;

  public constructor(props: { actionId: string; targetCompanyId: string; reason: string }) {
    super(props.actionId, 'PlatformAdminAction');
    this.targetCompanyId = props.targetCompanyId;
    this.reason = props.reason;
  }
}

export class PlatformAdminAccountReactivated extends DomainEventBase {
  public readonly targetCompanyId: string;
  public readonly reason: string;

  public constructor(props: { actionId: string; targetCompanyId: string; reason: string }) {
    super(props.actionId, 'PlatformAdminAction');
    this.targetCompanyId = props.targetCompanyId;
    this.reason = props.reason;
  }
}

export class PlatformAdminTrialExtended extends DomainEventBase {
  public readonly targetCompanyId: string;
  public readonly newTrialEndsAt: string;
  public readonly reason: string;

  public constructor(props: {
    actionId: string;
    targetCompanyId: string;
    newTrialEndsAt: string;
    reason: string;
  }) {
    super(props.actionId, 'PlatformAdminAction');
    this.targetCompanyId = props.targetCompanyId;
    this.newTrialEndsAt = props.newTrialEndsAt;
    this.reason = props.reason;
  }
}
