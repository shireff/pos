import { useT } from '../i18n';

export interface HealthStatus {
  dbConnected: boolean;
  encryptionActive: boolean;
  appVersion: string;
}

/**
 * HealthScreen — compact floating status bar anchored to the bottom-start corner.
 * Shows local DB + encryption status as small dot indicators.
 * Designed to be unobtrusive — not a full-page component.
 */
export function HealthScreen({ dbConnected, encryptionActive, appVersion }: HealthStatus) {
  const t = useT();

  // Don't render if everything is healthy — stay invisible in production
  const allHealthy = dbConnected && encryptionActive;

  return (
    <div
      role="status"
      aria-label={t('health.title')}
      style={{
        position: 'fixed',
        bottom: 'var(--space-4)',
        insetInlineStart: 'var(--space-4)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '6px var(--space-3)',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-md)',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-secondary)',
        userSelect: 'none',
        opacity: allHealthy ? 0.6 : 1,
        transition: 'opacity var(--transition-base)',
      }}
    >
      {/* DB indicator */}
      <StatusDot ok={dbConnected} title={t('health.localDb')} />

      {/* Encryption indicator */}
      <StatusDot ok={encryptionActive} title={t('health.encryption')} />

      {/* Divider */}
      <span
        aria-hidden
        style={{
          width: 1,
          height: 10,
          background: 'var(--color-border)',
          flexShrink: 0,
        }}
      />

      {/* Version */}
      <span style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
        v{appVersion}
      </span>
    </div>
  );
}

interface StatusDotProps {
  ok: boolean;
  title: string;
}

function StatusDot({ ok, title }: StatusDotProps) {
  return (
    <span
      title={title}
      aria-label={title}
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        flexShrink: 0,
        background: ok ? 'var(--color-success)' : 'var(--color-danger)',
        boxShadow: ok
          ? '0 0 4px rgba(22, 163, 74, 0.5)'
          : '0 0 4px rgba(220, 38, 38, 0.5)',
        transition: 'background var(--transition-base)',
      }}
    />
  );
}
