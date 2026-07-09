import { useT } from '../i18n';
import { Icon } from '../components/Icon';

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isPlatformAdmin?: boolean;
  brand?: string;
}

export function AuthShell({ title, subtitle, children, isPlatformAdmin = false, brand }: AuthShellProps) {
  const t = useT();
  return (
    <div className="auth-shell" style={isPlatformAdmin ? { background: 'linear-gradient(135deg, #0f172a, #1e293b)' } : undefined}>
      <div className="auth-card" style={isPlatformAdmin ? { background: '#111827', borderColor: 'rgba(255,255,255,0.12)', color: '#f8fafc' } : undefined}>
        <div className="auth-brand" style={isPlatformAdmin ? { color: '#f8fafc' } : undefined}>
          <span className="auth-brand__logo">
            <Icon name="store" size={22} />
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{brand ?? t('app.name')}</div>
            {isPlatformAdmin && (
              <div style={{ fontSize: 'var(--font-size-xs)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-warning)' }}>
                {t('auth.internalTool')}
              </div>
            )}
          </div>
        </div>
        <h1 className="auth-title" style={isPlatformAdmin ? { color: '#f8fafc' } : undefined}>{title}</h1>
        {subtitle ? (
          <p className="auth-subtitle" style={isPlatformAdmin ? { color: '#cbd5e1' } : undefined}>{subtitle}</p>
        ) : null}
        <div className="auth-form">{children}</div>
      </div>
    </div>
  );
}
