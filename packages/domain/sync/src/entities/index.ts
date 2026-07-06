import { Identifier } from '@packages/shared-kernel';
import { SyncApplyStatus, ConflictResolutionStatus } from '../value-objects';

// ─── SyncOutboxEntry ──────────────────────────────────────────────────────────

export interface SyncOutboxEntryProps {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventPayloadJson: string;
  createdAt: string;
  sentAt: string | null;
  acknowledgedAt: string | null;
  deviceId: string;
}

/** Append-only outbox entry — written in the same transaction as the domain write. */
export class SyncOutboxEntry {
  public readonly id: string;
  public readonly aggregateType: string;
  public readonly aggregateId: string;
  public readonly eventPayloadJson: string;
  public readonly createdAt: string;
  private _sentAt: string | null;
  private _acknowledgedAt: string | null;
  public readonly deviceId: string;

  private constructor(props: SyncOutboxEntryProps) {
    this.id = props.id;
    this.aggregateType = props.aggregateType;
    this.aggregateId = props.aggregateId;
    this.eventPayloadJson = props.eventPayloadJson;
    this.createdAt = props.createdAt;
    this._sentAt = props.sentAt;
    this._acknowledgedAt = props.acknowledgedAt;
    this.deviceId = props.deviceId;
  }

  public static create(
    props: Omit<SyncOutboxEntryProps, 'id' | 'createdAt' | 'sentAt' | 'acknowledgedAt'>,
  ): SyncOutboxEntry {
    return new SyncOutboxEntry({
      id: Identifier.generate(),
      createdAt: new Date().toISOString(),
      sentAt: null,
      acknowledgedAt: null,
      ...props,
    });
  }

  public static reconstitute(props: SyncOutboxEntryProps): SyncOutboxEntry {
    return new SyncOutboxEntry(props);
  }

  public get sentAt(): string | null {
    return this._sentAt;
  }
  public get acknowledgedAt(): string | null {
    return this._acknowledgedAt;
  }
  public get isPending(): boolean {
    return this._sentAt === null;
  }

  public markSent(): void {
    this._sentAt = new Date().toISOString();
  }
  public markAcknowledged(): void {
    this._acknowledgedAt = new Date().toISOString();
  }
}

// ─── SyncInboxEntry ───────────────────────────────────────────────────────────

export interface SyncInboxEntryProps {
  id: string;
  sourceDeviceId: string;
  eventPayloadJson: string;
  receivedAt: string;
  appliedAt: string | null;
  applyStatus: SyncApplyStatus;
}

export class SyncInboxEntry {
  public readonly id: string;
  public readonly sourceDeviceId: string;
  public readonly eventPayloadJson: string;
  public readonly receivedAt: string;
  private _appliedAt: string | null;
  private _applyStatus: SyncApplyStatus;

  private constructor(props: SyncInboxEntryProps) {
    this.id = props.id;
    this.sourceDeviceId = props.sourceDeviceId;
    this.eventPayloadJson = props.eventPayloadJson;
    this.receivedAt = props.receivedAt;
    this._appliedAt = props.appliedAt;
    this._applyStatus = props.applyStatus;
  }

  public static receive(
    props: Omit<SyncInboxEntryProps, 'id' | 'receivedAt' | 'appliedAt' | 'applyStatus'>,
  ): SyncInboxEntry {
    return new SyncInboxEntry({
      id: Identifier.generate(),
      receivedAt: new Date().toISOString(),
      appliedAt: null,
      applyStatus: 'pending',
      ...props,
    });
  }

  public static reconstitute(props: SyncInboxEntryProps): SyncInboxEntry {
    return new SyncInboxEntry(props);
  }

  public get appliedAt(): string | null {
    return this._appliedAt;
  }
  public get applyStatus(): SyncApplyStatus {
    return this._applyStatus;
  }

  public markApplied(): void {
    this._applyStatus = 'applied';
    this._appliedAt = new Date().toISOString();
  }

  public markConflict(): void {
    this._applyStatus = 'conflict';
  }
}

// ─── SyncConflict ─────────────────────────────────────────────────────────────

export interface SyncConflictProps {
  id: string;
  entityType: string;
  entityId: string;
  localVersionJson: string;
  remoteVersionJson: string;
  conflictingFieldsJson: string;
  resolutionStatus: ConflictResolutionStatus;
  resolvedByUserId: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export class SyncConflict {
  public readonly id: string;
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly localVersionJson: string;
  public readonly remoteVersionJson: string;
  public readonly conflictingFieldsJson: string;
  private _resolutionStatus: ConflictResolutionStatus;
  private _resolvedByUserId: string | null;
  private _resolvedAt: string | null;
  public readonly createdAt: string;

  private constructor(props: SyncConflictProps) {
    this.id = props.id;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.localVersionJson = props.localVersionJson;
    this.remoteVersionJson = props.remoteVersionJson;
    this.conflictingFieldsJson = props.conflictingFieldsJson;
    this._resolutionStatus = props.resolutionStatus;
    this._resolvedByUserId = props.resolvedByUserId;
    this._resolvedAt = props.resolvedAt;
    this.createdAt = props.createdAt;
  }

  public static detect(
    props: Omit<
      SyncConflictProps,
      'id' | 'resolutionStatus' | 'resolvedByUserId' | 'resolvedAt' | 'createdAt'
    >,
  ): SyncConflict {
    return new SyncConflict({
      id: Identifier.generate(),
      resolutionStatus: 'pending',
      resolvedByUserId: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      ...props,
    });
  }

  public static reconstitute(props: SyncConflictProps): SyncConflict {
    return new SyncConflict(props);
  }

  public get resolutionStatus(): ConflictResolutionStatus {
    return this._resolutionStatus;
  }
  public get resolvedByUserId(): string | null {
    return this._resolvedByUserId;
  }
  public get resolvedAt(): string | null {
    return this._resolvedAt;
  }

  public resolveManually(resolvedByUserId: string): void {
    if (this._resolutionStatus !== 'pending') throw new Error('Conflict is already resolved');
    this._resolutionStatus = 'manual_resolved';
    this._resolvedByUserId = resolvedByUserId;
    this._resolvedAt = new Date().toISOString();
  }

  public resolveAuto(): void {
    this._resolutionStatus = 'auto_resolved';
    this._resolvedAt = new Date().toISOString();
  }
}
