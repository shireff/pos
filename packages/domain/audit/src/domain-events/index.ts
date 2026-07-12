import { DomainEventBase } from '@packages/shared-kernel';
import { AuditActionCode } from '../value-objects';

/**
 * AuditEntryRecorded is emitted whenever a new audit entry is committed.
 * Consumed by the Notification Dispatcher and the audit log read-model projector.
 */
export class AuditEntryRecorded extends DomainEventBase {
  public readonly companyId: string;
  public readonly actorUserId: string;
  public readonly actionCode: AuditActionCode;
  public readonly entityType: string;
  public readonly entityId: string;

  public constructor(props: {
    auditEntryId: string;
    companyId: string;
    actorUserId: string;
    actionCode: AuditActionCode;
    entityType: string;
    entityId: string;
  }) {
    super(props.auditEntryId, 'AuditEntry');
    this.companyId = props.companyId;
    this.actorUserId = props.actorUserId;
    this.actionCode = props.actionCode;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
  }
}

/**
 * Emitted when a scheduled backup job fails, triggering a Critical alert to owners (Notifications.md §3).
 */
export class BackupFailed extends DomainEventBase {
  public readonly companyId: string;
  public readonly reason: string;

  public constructor(props: { backupId: string; companyId: string; reason: string }) {
    super(props.backupId, 'Backup');
    this.companyId = props.companyId;
    this.reason = props.reason;
  }
}
