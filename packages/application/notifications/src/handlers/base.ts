import type {
  NotificationCategory,
  NotificationPriorityLevel,
} from '@packages/domain-notifications';
import type { NotificationDraft, NotificationHandlerContext } from '../ports';

export interface DraftInput {
  companyId: string;
  recipientUserIds: string[];
  triggerCode: string;
  category: NotificationCategory;
  priority: NotificationPriorityLevel;
  titleKey: string;
  bodyKey: string;
  vars?: Record<string, string | number>;
  actionUrl?: string;
  referenceType?: string;
  referenceId?: string;
}

export function makeDraft(input: DraftInput): NotificationDraft {
  return {
    companyId: input.companyId,
    recipientUserIds: input.recipientUserIds,
    triggerCode: input.triggerCode,
    category: input.category,
    priority: input.priority,
    titleKey: input.titleKey,
    bodyKey: input.bodyKey,
    vars: input.vars,
    actionUrl: input.actionUrl,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
  };
}

export function ownerDraft(
  ctx: NotificationHandlerContext,
  input: Omit<DraftInput, 'recipientUserIds'>,
): { draft: NotificationDraft; recipients: Promise<string[]> } {
  const recipients = ctx.resolve({ kind: 'OWNER' });
  return {
    recipients,
    draft: makeDraft({ recipientUserIds: [], ...input }),
  };
}
