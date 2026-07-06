import { Identifier } from '@packages/shared-kernel';
import { AuditActionCode } from '../value-objects';

/**
 * AuditEntry is append-only and immutable once created.
 * No update or delete operations are permitted against this entity.
 */
export interface AuditEntryProps {
  id: string;
  companyId: string;
  actorUserId: string;
  actionCode: AuditActionCode;
  entityType: string;
  entityId: string;
  beforeJson: string | null;
  afterJson: string | null;
  occurredAt: string;
  deviceId: string;
}

export class AuditEntry {
  public readonly id: string;
  public readonly companyId: string;
  public readonly actorUserId: string;
  public readonly actionCode: AuditActionCode;
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly beforeJson: string | null;
  public readonly afterJson: string | null;
  public readonly occurredAt: string;
  public readonly deviceId: string;

  private constructor(props: AuditEntryProps) {
    this.id = props.id;
    this.companyId = props.companyId;
    this.actorUserId = props.actorUserId;
    this.actionCode = props.actionCode;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.beforeJson = props.beforeJson;
    this.afterJson = props.afterJson;
    this.occurredAt = props.occurredAt;
    this.deviceId = props.deviceId;
  }

  /**
   * Records a new audit entry. This is the only way to create one.
   * The resulting object is fully immutable — no setters.
   */
  public static record(props: Omit<AuditEntryProps, 'id' | 'occurredAt'>): AuditEntry {
    return new AuditEntry({
      id: Identifier.generate(),
      occurredAt: new Date().toISOString(),
      ...props,
    });
  }

  public static reconstitute(props: AuditEntryProps): AuditEntry {
    return new AuditEntry(props);
  }
}
