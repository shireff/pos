import { Identifier } from '@packages/shared-kernel';
import { HybridLogicalClock } from '@packages/shared-kernel';

export type SyncConflictStatus =
  | 'unresolved'
  | 'resolved_local'
  | 'resolved_remote'
  | 'resolved_merge';

export interface ConflictAuditEntry {
  at: string;
  byUserId: string | null;
  resolution: SyncConflictStatus;
  value: unknown;
  note?: string;
}

export interface SyncConflictProps {
  id: string;
  companyId: string;
  entityType: string;
  entityId: string;
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  localHlc: HybridLogicalClock;
  remoteHlc: HybridLogicalClock;
  status: SyncConflictStatus;
  auditTrail: ConflictAuditEntry[];
  createdAt: string;
}

/**
 * SyncConflict captures a single field-level concurrent edit that the
 * Class B merge strategy could not auto-resolve.
 * The user (or owner) selects the winner; resolution is recorded in the audit trail.
 */
export class SyncConflict {
  public readonly id: string;
  public readonly companyId: string;
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly field: string;
  public readonly localValue: unknown;
  public readonly remoteValue: unknown;
  public readonly localHlc: HybridLogicalClock;
  public readonly remoteHlc: HybridLogicalClock;
  public readonly createdAt: string;
  private _status: SyncConflictStatus;
  private _auditTrail: ConflictAuditEntry[];

  private constructor(props: SyncConflictProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.field = props.field;
    this.localValue = props.localValue;
    this.remoteValue = props.remoteValue;
    this.localHlc = props.localHlc;
    this.remoteHlc = props.remoteHlc;
    this._status = props.status;
    this._auditTrail = [...props.auditTrail];
    this.createdAt = props.createdAt;
  }

  public static detect(props: {
    companyId: string;
    entityType: string;
    entityId: string;
    field: string;
    localValue: unknown;
    remoteValue: unknown;
    localHlc: HybridLogicalClock;
    remoteHlc: HybridLogicalClock;
  }): SyncConflict {
    const now = new Date().toISOString();
    return new SyncConflict({
      id: Identifier.generate(),
      status: 'unresolved',
      auditTrail: [],
      createdAt: now,
      ...props,
    });
  }

  public static reconstitute(props: SyncConflictProps): SyncConflict {
    return new SyncConflict(props);
  }

  public get status(): SyncConflictStatus {
    return this._status;
  }

  public get auditTrail(): readonly ConflictAuditEntry[] {
    return this._auditTrail;
  }

  public get isUnresolved(): boolean {
    return this._status === 'unresolved';
  }

  /** The value that should be applied to converge, given the chosen winner. */
  public resolvedValue(winner: 'local' | 'remote' | 'merge', merged?: unknown): unknown {
    if (winner === 'local') return this.localValue;
    if (winner === 'remote') return this.remoteValue;
    return merged ?? this.localValue;
  }

  public resolveLocal(byUserId: string | null, note?: string): void {
    this.assertUnresolved();
    this._status = 'resolved_local';
    this.recordAudit(byUserId, 'resolved_local', this.localValue, note);
  }

  public resolveRemote(byUserId: string | null, note?: string): void {
    this.assertUnresolved();
    this._status = 'resolved_remote';
    this.recordAudit(byUserId, 'resolved_remote', this.remoteValue, note);
  }

  public resolveMerge(byUserId: string | null, mergedValue: unknown, note?: string): void {
    this.assertUnresolved();
    this._status = 'resolved_merge';
    this.recordAudit(byUserId, 'resolved_merge', mergedValue, note);
  }

  private assertUnresolved(): void {
    if (this._status !== 'unresolved') {
      throw new Error(`Conflict ${this.id} is already resolved (${this._status})`);
    }
  }

  private recordAudit(
    byUserId: string | null,
    resolution: SyncConflictStatus,
    value: unknown,
    note?: string,
  ): void {
    this._auditTrail.push({
      at: new Date().toISOString(),
      byUserId,
      resolution,
      value,
      note,
    });
  }
}
