import { useT } from '../i18n';
import { Icon } from '../components/Icon';

export interface PaywallProps {
  mode: 'trial_expired' | 'suspended';
  onChoosePlan?: () => void;
}

export function Paywall({ mode, onChoosePlan }: PaywallProps) {
  const t = useT();
  const isSuspended = mode === 'suspended';

  return (
    <div
      className="card"
      style={{
        display: 'grid',
        gap: 'var(--space-4)',
        padding: 'var(--space-6)',
        background: isSuspended ? 'var(--color-danger-soft)' : 'var(--color-warning-soft)',
        borderColor: isSuspended ? 'var(--color-danger)' : 'var(--color-warning)',
        color: isSuspended ? 'var(--color-danger-on)' : 'var(--color-warning-on)',
      }}
    >
      <div className="row" style={{ gap: 'var(--space-2)' }}>
        <Icon name="alert-triangle" size={22} />
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', color: 'inherit' }}>
          {isSuspended ? t('paywall.suspended') : t('paywall.trialExpired')}
        </h2>
      </div>
      <p style={{ margin: 0, lineHeight: 1.6, color: 'inherit' }}>
        {isSuspended ? t('paywall.suspendedDesc') : t('paywall.trialExpiredDesc')}
      </p>

      {!isSuspended && (
        <div className="card" style={{ background: 'var(--color-bg-surface)', padding: 'var(--space-4)' }}>
          <div style={{ fontWeight: 700, marginBlockEnd: 'var(--space-2)' }}>{t('system.plans')}</div>
          <div style={{ display: 'grid', gap: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>
            <div>Basic • {t('nav.catalog')} + {t('nav.inventory')}</div>
            <div>Pro • {t('nav.reports')} + {t('common.sync')}</div>
            <div>Enterprise • {t('nav.more')} + AI</div>
          </div>
        </div>
      )}

      {!isSuspended ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={onChoosePlan}
          style={{ width: '100%' }}
        >
          {t('paywall.choosePlan')}
        </button>
      ) : (
        <a className="btn btn-secondary" style={{ textAlign: 'center', color: 'var(--color-danger-on)' }} href="mailto:support@smartretailos.example">
          {t('paywall.contactSupport')}
        </a>
      )}
    </div>
  );
}
