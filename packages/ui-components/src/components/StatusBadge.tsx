import type { ReactNode } from 'react';
import { useT } from '../i18n';

const STATUS_MAP: Record<string, { cls: string; key: string }> = {
  active: { cls: 'badge-active', key: 'status.active' },
  archived: { cls: 'badge-archived', key: 'status.archived' },
  draft: { cls: 'badge-draft', key: 'status.draft' },
  suspended: { cls: 'badge-suspended', key: 'status.suspended' },
  trialing: { cls: 'badge-trialing', key: 'status.trialing' },
  trial_expired: { cls: 'badge-trial-expired', key: 'status.trial_expired' },
  past_due: { cls: 'badge-trial-expired', key: 'status.past_due' },
  pending_approval: { cls: 'badge-trialing', key: 'status.pending_approval' },
  approved: { cls: 'badge-active', key: 'status.approved' },
  partially_received: { cls: 'badge-draft', key: 'status.partially_received' },
  fully_received: { cls: 'badge-active', key: 'status.fully_received' },
  cancelled: { cls: 'badge-suspended', key: 'status.cancelled' },
};

export interface StatusBadgeProps {
  status: string;
  children?: ReactNode;
  dot?: boolean;
}

export function StatusBadge({ status, children, dot = true }: StatusBadgeProps) {
  const t = useT();
  const m = STATUS_MAP[status] ?? { cls: '', key: status };
  return (
    <span className={`badge ${m.cls}`}>
      {dot && <span className="badge-dot" />}
      {children ?? t(m.key)}
    </span>
  );
}
