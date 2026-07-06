import { AuditEntry } from '../entities';
import { AuditActionCode } from '../value-objects';

/**
 * AuditLogger is the single point through which audit entries are created.
 * It enforces that the underlying repository is append-only.
 */
export interface AuditRepository {
  record(entry: AuditEntry): Promise<void>;
  findByEntity(entityType: string, entityId: string, companyId: string): Promise<AuditEntry[]>;
  findByActor(
    actorUserId: string,
    companyId: string,
    from: string,
    to: string,
  ): Promise<AuditEntry[]>;
}

export class AuditLogger {
  public constructor(private readonly repo: AuditRepository) {}

  public async log(props: {
    companyId: string;
    actorUserId: string;
    actionCode: AuditActionCode;
    entityType: string;
    entityId: string;
    before?: object;
    after?: object;
    deviceId: string;
  }): Promise<AuditEntry> {
    const entry = AuditEntry.record({
      companyId: props.companyId,
      actorUserId: props.actorUserId,
      actionCode: props.actionCode,
      entityType: props.entityType,
      entityId: props.entityId,
      beforeJson: props.before ? JSON.stringify(props.before) : null,
      afterJson: props.after ? JSON.stringify(props.after) : null,
      deviceId: props.deviceId,
    });
    await this.repo.record(entry);
    return entry;
  }
}
