/**
 * DeviceVectorClock tracks the logical clock per device for HLC-based
 * causal ordering of sync events (Sync_Architecture.md §4).
 */
export interface DeviceVectorClockProps {
  deviceId: string;
  logicalClock: number;
}

export class DeviceVectorClock {
  public readonly deviceId: string;
  private _logicalClock: number;

  public constructor(props: DeviceVectorClockProps) {
    this.deviceId = props.deviceId;
    this._logicalClock = props.logicalClock;
  }

  public get logicalClock(): number {
    return this._logicalClock;
  }

  public advance(): DeviceVectorClock {
    return new DeviceVectorClock({ deviceId: this.deviceId, logicalClock: this._logicalClock + 1 });
  }

  public updateFrom(incoming: DeviceVectorClock): DeviceVectorClock {
    return new DeviceVectorClock({
      deviceId: this.deviceId,
      logicalClock: Math.max(this._logicalClock, incoming.logicalClock) + 1,
    });
  }

  public isCausallyAfter(other: DeviceVectorClock): boolean {
    return this._logicalClock > other._logicalClock;
  }

  public isConcurrentWith(other: DeviceVectorClock): boolean {
    return this._logicalClock === other._logicalClock;
  }
}

/**
 * SyncCursor tracks how far a device pairing has synced,
 * enabling incremental (delta) sync without retransmitting history.
 */
export interface SyncCursorProps {
  deviceId: string;
  peerDeviceIdOrServer: string;
  lastAcknowledgedSequence: number;
}

export class SyncCursor {
  public readonly deviceId: string;
  public readonly peerDeviceIdOrServer: string;
  private _lastAcknowledgedSequence: number;

  public constructor(props: SyncCursorProps) {
    this.deviceId = props.deviceId;
    this.peerDeviceIdOrServer = props.peerDeviceIdOrServer;
    this._lastAcknowledgedSequence = props.lastAcknowledgedSequence;
  }

  public get lastAcknowledgedSequence(): number {
    return this._lastAcknowledgedSequence;
  }

  public advance(sequence: number): void {
    if (sequence > this._lastAcknowledgedSequence) {
      this._lastAcknowledgedSequence = sequence;
    }
  }
}
