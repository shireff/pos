import { DomainEventBase } from '@packages/shared-kernel';
import { SyncTransportType } from '../value-objects';

export class SyncBatchPushed extends DomainEventBase {
  public readonly peerOrServer: string;
  public readonly eventCount: number;
  public readonly transportUsed: SyncTransportType;

  public constructor(props: {
    deviceId: string;
    peerOrServer: string;
    eventCount: number;
    transportUsed: SyncTransportType;
  }) {
    super(props.deviceId, 'Device');
    this.peerOrServer = props.peerOrServer;
    this.eventCount = props.eventCount;
    this.transportUsed = props.transportUsed;
  }
}

export class SyncBatchPulled extends DomainEventBase {
  public readonly sourceDeviceOrServer: string;
  public readonly eventCount: number;
  public readonly transportUsed: SyncTransportType;

  public constructor(props: {
    deviceId: string;
    sourceDeviceOrServer: string;
    eventCount: number;
    transportUsed: SyncTransportType;
  }) {
    super(props.deviceId, 'Device');
    this.sourceDeviceOrServer = props.sourceDeviceOrServer;
    this.eventCount = props.eventCount;
    this.transportUsed = props.transportUsed;
  }
}

export class SyncConflictDetected extends DomainEventBase {
  public readonly companyId: string;
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly conflictingFields: string[];

  public constructor(props: {
    conflictId: string;
    companyId: string;
    entityType: string;
    entityId: string;
    conflictingFields: string[];
  }) {
    super(props.conflictId, 'SyncConflict');
    this.companyId = props.companyId;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.conflictingFields = props.conflictingFields;
  }
}

export class SyncConflictResolved extends DomainEventBase {
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly resolvedByUserId: string | null;

  public constructor(props: {
    conflictId: string;
    entityType: string;
    entityId: string;
    resolvedByUserId: string | null;
  }) {
    super(props.conflictId, 'SyncConflict');
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.resolvedByUserId = props.resolvedByUserId;
  }
}
