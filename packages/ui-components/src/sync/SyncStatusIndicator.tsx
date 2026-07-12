import type { CSSProperties } from 'react';
import { Icon, type IconName } from '../components/Icon';
import type { SyncStatusView, SyncTransportType } from '../stores/sync.store';
import { useT } from '../i18n';

export interface SyncStatusIndicatorProps {
  status: SyncStatusView;
  onRefresh?: () => void;
  className?: string;
}

const TRANSPORT_META: Record<SyncTransportType, { icon: IconName; key: string }> = {
  lan: { icon: 'wifi', key: 'sync.lan' },
  supabase_realtime: { icon: 'globe', key: 'sync.cloud' },
  websocket: { icon: 'monitor', key: 'sync.ws' },
};

/**
 * Persistent sync status widget: last sync time, pending-outbox badge,
 * transport-type icon, and an offline indicator. Updates in real time because
 * it reads from the external sync store.
 */
export function SyncStatusIndicator({ status, onRefresh, className }: SyncStatusIndicatorProps) {
  const t = useT();
  const transport = TRANSPORT_META[status.transportType];
  const lastSyncLabel = status.lastSyncedAt
    ? new Date(status.lastSyncedAt).toLocaleTimeString()
    : '—';
  const hasPending = status.pendingOutbox + status.pendingInbox > 0;

  const container: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '6px 12px',
    borderRadius: 8,
    background: status.offline ? '#fde8e8' : '#eef6ff',
    color: status.offline ? '#9b1c1c' : '#1e3a5f',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 13,
    ...(className ? {} : {}),
  };

  return (
    <div className={className} style={container} role="status" aria-live="polite">
      {status.offline ? (
        <Icon name="wifi-off" size={16} />
      ) : (
        <Icon name={transport.icon} size={16} />
      )}

      <span>{status.offline ? t('sync.offline') : t(transport.key)}</span>

      {hasPending && (
        <span
          title={t('sync.pendingOutbox')}
          style={{
            background: '#d64545',
            color: '#fff',
            borderRadius: 999,
            padding: '1px 8px',
            fontWeight: 700,
          }}
        >
          {status.pendingOutbox + status.pendingInbox}
        </span>
      )}

      <span style={{ opacity: 0.8 }}>{t('sync.lastSync')} {lastSyncLabel}</span>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh sync status"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            color: 'inherit',
          }}
        >
          <Icon name="refresh" size={16} />
        </button>
      )}
    </div>
  );
}
