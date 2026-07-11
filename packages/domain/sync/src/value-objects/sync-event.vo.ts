import { Identifier } from '@packages/shared-kernel';
import { HybridLogicalClock } from '@packages/shared-kernel';

export type SyncEventStatus = 'pending' | 'sent' | 'acknowledged';

export interface SyncEventProps {
  eventId: string;
  eventType: string;
  payload: unknown;
  hlcTimestamp: HybridLogicalClock;
  deviceId: string;
  companyId: string;
  occurredAt: string;
}

/**
 * SyncEvent is the immutable unit of replication.
 * Every domain write produces a SyncEvent that is appended to the outbox and
 * replayed (idempotently) on every peer device.
 */
export class SyncEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly payload: unknown;
  public readonly hlcTimestamp: HybridLogicalClock;
  public readonly deviceId: string;
  public readonly companyId: string;
  public readonly occurredAt: string;
  private _status: SyncEventStatus;

  private constructor(props: SyncEventProps, status: SyncEventStatus = 'pending') {
    this.eventId = props.eventId;
    this.eventType = props.eventType;
    this.payload = props.payload;
    this.hlcTimestamp = props.hlcTimestamp;
    this.deviceId = props.deviceId;
    this.companyId = props.companyId;
    this.occurredAt = props.occurredAt;
    this._status = status;
  }

  public static create(props: {
    eventType: string;
    payload: unknown;
    hlcTimestamp: HybridLogicalClock;
    deviceId: string;
    companyId: string;
  }): SyncEvent {
    return new SyncEvent({
      eventId: Identifier.generate(),
      occurredAt: new Date().toISOString(),
      ...props,
    });
  }

  public static reconstitute(props: SyncEventProps, status: SyncEventStatus): SyncEvent {
    return new SyncEvent(props, status);
  }

  public get status(): SyncEventStatus {
    return this._status;
  }

  public markSent(): void {
    this._status = 'sent';
  }

  public markAcknowledged(): void {
    this._status = 'acknowledged';
  }
}
