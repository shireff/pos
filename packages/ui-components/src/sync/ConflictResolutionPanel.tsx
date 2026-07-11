import type { CSSProperties } from 'react';
import { Icon } from '../components/Icon';
import type { SyncConflictView } from '../stores/sync.store';

export type ConflictWinner = 'local' | 'remote' | 'merge';

export interface ConflictResolutionPanelProps {
  conflict: SyncConflictView;
  /** Called when the user picks a winner. */
  onResolve: (id: string, winner: ConflictWinner, resolvedValue?: unknown) => void;
  className?: string;
}

/**
 * Side-by-side comparison of the conflicting local and remote values with
 * resolution buttons and an audit-trail display. Resolving records the winner
 * in the audit trail (handled by the sync engine) and converges the device.
 */
export function ConflictResolutionPanel({
  conflict,
  onResolve,
  className,
}: ConflictResolutionPanelProps) {
  const resolved = conflict.status !== 'unresolved';
  const cell: CSSProperties = {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: 6,
    padding: 10,
  };
  const label: CSSProperties = { fontSize: 11, textTransform: 'uppercase', opacity: 0.6 };

  return (
    <div className={className} style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 520 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon name="alert-triangle" size={18} />
        <strong>
          {conflict.entityType}:{conflict.entityId} · {conflict.field}
        </strong>
        {resolved && (
          <span style={{ color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="check-circle" size={16} /> {conflict.status}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={cell}>
          <div style={label}>Local</div>
          <div>{JSON.stringify(conflict.localValue)}</div>
        </div>
        <div style={cell}>
          <div style={label}>Remote</div>
          <div>{JSON.stringify(conflict.remoteValue)}</div>
        </div>
      </div>

      {!resolved && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => onResolve(conflict.id, 'local')}>
            Keep Local
          </button>
          <button type="button" onClick={() => onResolve(conflict.id, 'remote')}>
            Keep Remote
          </button>
          <button type="button" onClick={() => onResolve(conflict.id, 'merge', conflict.remoteValue)}>
            Merge
          </button>
        </div>
      )}

      {conflict.auditTrail && conflict.auditTrail.length > 0 && (
        <ul style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
          {conflict.auditTrail.map((entry, i) => (
            <li key={i}>
              {entry.resolution} by {entry.byUserId ?? 'system'} at{' '}
              {new Date(entry.at).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
