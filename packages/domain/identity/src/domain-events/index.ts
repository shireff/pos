import { DomainEventBase } from '@packages/shared-kernel';

export class UserAuthenticated extends DomainEventBase {
  public readonly userId: string;
  public readonly companyId: string;
  public readonly deviceId: string;
  public readonly authMethod: 'online' | 'offline_pin';

  public constructor(props: {
    userId: string;
    companyId: string;
    deviceId: string;
    authMethod: 'online' | 'offline_pin';
  }) {
    super(props.userId, 'User');
    this.userId = props.userId;
    this.companyId = props.companyId;
    this.deviceId = props.deviceId;
    this.authMethod = props.authMethod;
  }
}

export class UserLoginFailed extends DomainEventBase {
  public readonly userId: string | null;
  public readonly companyId: string;
  public readonly deviceId: string;
  public readonly reason: string;

  public constructor(props: {
    userId: string | null;
    companyId: string;
    deviceId: string;
    reason: string;
  }) {
    super(props.userId ?? 'unknown', 'User');
    this.userId = props.userId;
    this.companyId = props.companyId;
    this.deviceId = props.deviceId;
    this.reason = props.reason;
  }
}

export class DeviceRegistered extends DomainEventBase {
  public readonly deviceId: string;
  public readonly companyId: string;
  public readonly deviceType: 'desktop' | 'android';

  public constructor(props: {
    deviceId: string;
    companyId: string;
    deviceType: 'desktop' | 'android';
  }) {
    super(props.deviceId, 'Device');
    this.deviceId = props.deviceId;
    this.companyId = props.companyId;
    this.deviceType = props.deviceType;
  }
}

export class DeviceRevoked extends DomainEventBase {
  public readonly deviceId: string;
  public readonly companyId: string;
  public readonly revokedByUserId: string;

  public constructor(props: { deviceId: string; companyId: string; revokedByUserId: string }) {
    super(props.deviceId, 'Device');
    this.deviceId = props.deviceId;
    this.companyId = props.companyId;
    this.revokedByUserId = props.revokedByUserId;
  }
}

export class PermissionRoleChanged extends DomainEventBase {
  public readonly roleId: string;
  public readonly actingUserId: string;
  public readonly beforeJson: string;
  public readonly afterJson: string;

  public constructor(props: {
    roleId: string;
    actingUserId: string;
    before: object;
    after: object;
  }) {
    super(props.roleId, 'Role');
    this.roleId = props.roleId;
    this.actingUserId = props.actingUserId;
    this.beforeJson = JSON.stringify(props.before);
    this.afterJson = JSON.stringify(props.after);
  }
}
