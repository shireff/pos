'use client';

import { useEffect, useMemo, useState } from 'react';
import { AuthShell, Paywall, getTrialCountdownState, useT, Icon, StatusBadge } from '@packages/ui-components';
import { CapacitorHealthBridge } from '../bootstrap/capacitor-health.bridge';
import type { AppHealth } from '../bootstrap/capacitor-health.bridge';
import { useAppDispatch, useAppSelector } from '../lib/store/hooks';
import {
  login,
  logout,
  restoreSession,
  verifyMfa,
  clearMfaState,
} from '../lib/store/authSlice';
import {
  fetchSubscription,
  fetchHealth,
  registerDevice,
} from '../lib/store/systemSlice';
import { ProductListPage } from '../features/catalog/ProductListPage';
import { CategoryTreePage } from '../features/categories/CategoryTreePage';
import { PurchaseOrderListPage } from '../features/purchasing/PurchaseOrderListPage';
import { PosScreen } from '../features/pos/PosScreen';
import { ApiEndpoints } from '../lib/api/endpoints';
import { client } from '../lib/api/client';

const bridge = new CapacitorHealthBridge();

type ActiveTab = 'catalog' | 'categories' | 'purchasing' | 'pos' | 'more';

export default function AndroidPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const system = useAppSelector((s) => s.system);

  const [health, setHealth] = useState<AppHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [companyCode, setCompanyCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [pinDigits, setPinDigits] = useState('');
  const [showPinPad, setShowPinPad] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');

  const isAuthenticated = Boolean(auth.token && auth.user);
  const isLoading = auth.status === 'loading';
  const isPlatformAdminView = isAuthenticated && !auth.user?.companyId;

  useEffect(() => {
    void dispatch(restoreSession());
    bridge.check()
      .then((r: AppHealth) => setHealth(r))
      .catch((err: unknown) => setHealthError(err instanceof Error ? err.message : 'Health check failed'));
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && !isPlatformAdminView) {
      void dispatch(fetchSubscription());
      void dispatch(fetchHealth());
    }
  }, [dispatch, isAuthenticated, isPlatformAdminView]);

  const activeTrialEndsAt = useMemo(() => {
    if (system.subscription?.trialEndsAt) return new Date(system.subscription.trialEndsAt);
    return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  }, [system.subscription?.trialEndsAt]);

  const countdownState = useMemo(
    () => getTrialCountdownState(activeTrialEndsAt),
    [activeTrialEndsAt],
  );

  const isLocked =
    system.subscription?.status === 'trial_expired' ||
    system.subscription?.status === 'suspended';

  const lockMode: 'trial_expired' | 'suspended' | null = isLocked
    ? system.subscription?.status === 'suspended' ? 'suspended' : 'trial_expired'
    : null;

  const handleLogin = async () => {
    await dispatch(login({ email, password, companyId: isPlatformAdmin ? undefined : companyCode, isPlatformAdmin })).unwrap();
  };

  const handleVerifyMfa = async () => {
    if (!auth.challengeToken) return;
    await dispatch(verifyMfa({ challengeToken: auth.challengeToken, code: mfaCode })).unwrap();
  };

  const handlePinKey = (key: string) => {
    if (key === '⌫') { setPinDigits((p) => p.slice(0, -1)); return; }
    if (key === '✓') {
      void (async () => {
        if (!auth.user) return;
        setPinError(null);
        try {
          await client.post(ApiEndpoints.AuthPin, {
            userId: auth.user.id,
            companyId: auth.user.companyId,
            pin: pinDigits,
            deviceFingerprint: `android-${Date.now()}`,
            deviceType: 'android',
          });
          setPinDigits('');
          setShowPinPad(false);
        } catch { setPinError(t('auth.invalidPin')); }
      })();
      return;
    }
    if (pinDigits.length < 6) setPinDigits((p) => p + key);
  };

  const handleRegisterDevice = async () => {
    if (!auth.user?.companyId) return;
    await dispatch(registerDevice({ companyId: auth.user.companyId, deviceType: 'android', deviceFingerprint: `android-${auth.user.companyId}-${Date.now()}` })).unwrap();
  };

  if (!isAuthenticated) {
    return (
      <main className="page" style={{ minHeight: '100dvh', justifyContent: 'center' }}>
        <AuthShell
          title={t('auth.signIn')}
          subtitle={t('app.name')}
          isPlatformAdmin={isPlatformAdmin}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="auth-toggles">
              <button className={`btn btn-secondary btn-sm${isPlatformAdmin ? ' btn-primary' : ''}`} onClick={() => setIsPlatformAdmin((v) => !v)}>
                <Icon name={isPlatformAdmin ? 'store' : 'shield'} size={16} />
                {isPlatformAdmin ? t('auth.tenantLogin') : t('auth.platformAdmin')}
              </button>
            </div>

            {auth.mfaRequired ? (
              <>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {t('auth.mfaPrompt')}
                </p>
                <div className="form-field">
                  <label className="form-label" htmlFor="mfa">{t('auth.mfaCode')}</label>
                  <input id="mfa" className="form-input num" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="123456" />
                </div>
                <button className="btn btn-primary btn-block" disabled={isLoading || mfaCode.length < 6} onClick={handleVerifyMfa}>
                  {isLoading ? t('common.loading') : t('auth.verify')}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { dispatch(clearMfaState()); setMfaCode(''); }}>
                  {t('common.cancel')}
                </button>
              </>
            ) : (
              <>
                {!isPlatformAdmin && (
                  <div className="form-field">
                    <label className="form-label" htmlFor="company-code">{t('auth.companyCode')}</label>
                    <input id="company-code" className="form-input" value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} placeholder="ACME" />
                  </div>
                )}
                <div className="form-field">
                  <label className="form-label" htmlFor="email">{t('auth.email')}</label>
                  <input id="email" className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="password">{t('auth.password')}</label>
                  <input id="password" className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <button className="btn btn-primary btn-block" disabled={isLoading || !email.trim() || !password.trim() || (!isPlatformAdmin && !companyCode.trim())} onClick={handleLogin}>
                  {isLoading ? t('common.loading') : t('auth.continue')}
                </button>
              </>
            )}

            {auth.error && <div className="error-banner">{auth.error}</div>}

            {countdownState.isVisible && (
              <div className={`trial-banner${countdownState.isCritical ? ' critical' : ' warning'}`}>
                {t('system.trialEnds', { days: countdownState.daysRemaining, hours: countdownState.hoursRemaining })}
              </div>
            )}
          </div>
        </AuthShell>

        <div className="status-card" style={{ width: '100%', maxWidth: 360, marginTop: 'var(--space-4)' }}>
          <p className="section-label">{t('health.status')}</p>
          {healthError && <div className="status-row"><span className="status-label">Error</span><span className="status-value" style={{ color: 'var(--color-danger)' }}>✕ {healthError}</span></div>}
          {!health && !healthError && <div className="status-row"><span className="status-label">…</span><span className="status-value" style={{ color: 'var(--color-warning)' }}>⏳</span></div>}
          {health && (
            <>
              <div className="status-row"><span className="status-label">{t('health.localDb')}</span><span className="status-value" style={{ color: health.status === 'ok' ? 'var(--color-success)' : 'var(--color-warning)' }}>{health.status === 'ok' ? `✓ ${t('health.ok')}` : `⚠ ${health.status}`}</span></div>
              <div className="status-row"><span className="status-label">{t('health.platform')}</span><span className="status-value" style={{ color: 'var(--color-text-tertiary)' }}>📱 {health.platform}</span></div>
              <div className="status-row"><span className="status-label">{t('health.version')}</span><span className="status-value num" style={{ color: 'var(--color-text-tertiary)' }}>v{health.version}</span></div>
            </>
          )}
        </div>
      </main>
    );
  }

  if (lockMode) {
    return (
      <main className="page" style={{ minHeight: '100dvh', justifyContent: 'center' }}>
        <AuthShell
          title={lockMode === 'suspended' ? t('lock.accountSuspended') : t('lock.trialExpired')}
          subtitle={t('lock.contactAdmin')}
          isPlatformAdmin={false}
        >
          <Paywall mode={lockMode} />
          <button className="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-4)' }} onClick={() => void dispatch(logout())}>
            {t('common.logout')}
          </button>
        </AuthShell>
      </main>
    );
  }

  const tabs: { id: ActiveTab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
    { id: 'catalog', label: t('catalog.products'), icon: 'package' },
    { id: 'categories', label: t('categories.title'), icon: 'tag' },
    { id: 'purchasing', label: 'Purchasing', icon: 'shopping-cart' },
    { id: 'pos', label: 'POS', icon: 'credit-card' },
    { id: 'more', label: t('more.title'), icon: 'more' },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg-base)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(var(--space-16) + env(safe-area-inset-bottom, 0px))' }}>
        {activeTab === 'catalog' && <ProductListPage />}
        {activeTab === 'categories' && <CategoryTreePage />}
        {activeTab === 'purchasing' && <PurchaseOrderListPage />}
        {activeTab === 'pos' && <PosScreen />}
        {activeTab === 'more' && (
          <div className="page">
            <h1 className="page-title">{t('more.title')}</h1>

            <div className="card">
              <p className="section-label">{t('more.device')}</p>
              <div className="status-row">
                <span className="status-label">{t('more.status')}</span>
                {system.registeredDevice ? (
                  <StatusBadge status="active">{t('more.deviceRegistered')}: {system.registeredDevice.deviceFingerprint}</StatusBadge>
                ) : (
                  <span className="status-value" style={{ color: 'var(--color-text-secondary)' }}>{t('more.deviceNotRegistered')}</span>
                )}
              </div>
              <button className="btn btn-primary btn-block" style={{ marginTop: 'var(--space-4)' }} onClick={handleRegisterDevice}>
                <Icon name="smartphone" size={16} />
                {system.registeredDevice ? t('system.reregister') : t('system.registerDevice')}
              </button>
            </div>

            <button className="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-4)' }} onClick={() => { setShowPinPad((v) => !v); setPinDigits(''); setPinError(null); }}>
              <Icon name="lock" size={16} />
              {t('more.offlinePin')}
            </button>

            {showPinPad && (
              <div className="card">
                <p style={{ fontWeight: 700, textAlign: 'center', marginBlockEnd: 'var(--space-3)' }}>{t('more.enterPin')}</p>
                <p style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: 'var(--font-size-xl)', minHeight: 32, marginBlockEnd: 'var(--space-3)' }}>
                  {'●'.repeat(pinDigits.length)}
                </p>
                {pinError && <div className="error-banner" style={{ marginBlockEnd: 'var(--space-3)' }}>{pinError}</div>}
                <div className="pin-grid">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((key) => (
                    <button key={key} type="button" className="pin-btn" onClick={() => handlePinKey(key)}>{key}</button>
                  ))}
                </div>
              </div>
            )}

            {system.subscription && (
              <div className="card" style={{ marginTop: 'var(--space-4)' }}>
                <p className="section-label">{t('more.subscription')}</p>
                <div className="status-row">
                  <span className="status-label">{t('more.status')}</span>
                  <StatusBadge status={system.subscription.status} />
                </div>
                <div className="status-row" style={{ borderBottom: 'none' }}>
                  <span className="status-label">{t('system.plan')}</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{system.subscription.planId ?? 'Free Trial'}</span>
                </div>
              </div>
            )}

            <button className="btn btn-danger btn-block" style={{ marginTop: 'var(--space-4)' }} onClick={() => void dispatch(logout())}>
              <Icon name="log-out" size={16} />
              {t('common.logout')}
            </button>
          </div>
        )}
      </div>

      <nav className="tab-bar-bottom" aria-label={t('nav.main')}>
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={`tab-item${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="nav-item__icon"><Icon name={tab.icon} size={22} /></span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
