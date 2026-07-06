import { Identifier } from '@packages/shared-kernel';
import { PlatformAdminActionCode } from '../value-objects';

/**
 * PlatformAdminAction — append-only cross-tenant audit record.
 * Never updated or deleted after creation (Security.md §11.4).
 */
export interface PlatformAdminActionProps {
  id: string;
  platformAdminId: string;
  targetCompanyId: string;
  actionCode: PlatformAdminActionCode;
  reason: string;
  beforeJson: string | null;
  afterJson: string | null;
  occurredAt: string;
}

export class PlatformAdminAction {
  public readonly id: string;
  public readonly platformAdminId: string;
  public readonly targetCompanyId: string;
  public readonly actionCode: PlatformAdminActionCode;
  public readonly reason: string;
  public readonly beforeJson: string | null;
  public readonly afterJson: string | null;
  public readonly occurredAt: string;

  private constructor(props: PlatformAdminActionProps) {
    if (!props.reason || props.reason.trim().length === 0)
      throw new Error('PlatformAdminAction: reason is mandatory (BR-XCT-003)');
    this.id = props.id;
    this.platformAdminId = props.platformAdminId;
    this.targetCompanyId = props.targetCompanyId;
    this.actionCode = props.actionCode;
    this.reason = props.reason;
    this.beforeJson = props.beforeJson;
    this.afterJson = props.afterJson;
    this.occurredAt = props.occurredAt;
  }

  public static record(
    props: Omit<PlatformAdminActionProps, 'id' | 'occurredAt'>,
  ): PlatformAdminAction {
    return new PlatformAdminAction({
      id: Identifier.generate(),
      occurredAt: new Date().toISOString(),
      ...props,
    });
  }

  public static reconstitute(props: PlatformAdminActionProps): PlatformAdminAction {
    return new PlatformAdminAction(props);
  }
}
