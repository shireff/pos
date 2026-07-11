import { useEffect, useMemo, useState } from 'react';
import {
  AuthShell,
  HealthScreen,
  type HealthStatus,
  Paywall,
  getTrialCountdownState,
  useT,
  Icon,
  Modal,
  Field,
} from '@packages/ui-components';
import { CatalogPage } from '../features/catalog/CatalogPage';
import { PurchasingPage } from '../features/purchasing/PurchasingPage';
import { CustomerListPage } from '../features/customers/CustomerListPage';
import { SupplierListPage } from '../features/suppliers/SupplierListPage';
import { PosRegisterPage } from '../features/pos/PosRegisterPage';
import { PlatformAdminPanel } from '../features/admin/PlatformAdminPanel';
import { DiscountRuleBuilderPage, CouponManagementPage, DiscountsPage } from '../features/discounts';
import { TaxRuleEditorPage, PriceChangePage, PricingPage } from '../features/pricing';
import { bootstrapDesktop } from '../bootstrap/desktop-bridge';
import { checkSelfLock, logger, getApiErrorMessage } from '@packages/shared-kernel';
import { useAppDispatch, useAppSelector } from '../lib/store/hooks';
import type { RootState } from '../lib/store';
import {
  login,
  restoreSession,
  verifyMfa,
  setupMfa,
  confirmMfaSetup,
  clearMfaState,
  logout,
} from '../lib/store/authSlice';
import { fetchSubscription } from '../lib/store/systemSlice';

const APP_VERSION = __APP_VERSION__;

export default function App() {
  const t = useT();
  const [status, setStatus] = useState<HealthStatus>({
    dbConnected: false,
    encryptionActive: false,
    appVersion: APP_VERSION,
  });
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [companyCode, setCompanyCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [activeView, setActiveView] = useState<'catalog' | 'purchasing' | 'customers' | 'suppliers' | 'pos' | 'discounts' | 'pricing'>('catalog');
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [setupCode, setSetupCode] = useState('');
  const [lockMode, setLockMode] = useState<'trial_expired' | 'suspended' | null>(null);

  const dispatch = useAppDispatch();
  const auth = useAppSelector((state: RootState) => state.auth);
  const system = useAppSelector((state: RootState) => state.system);
  const subscription = system.subscription;

  const isAuthenticated = Boolean(auth.token && auth.user);
  const isLoading = auth.status === 'loading';
  const errorMessage = getApiErrorMessage(auth.errorCode ?? undefined, 'ar', auth.error ?? undefined);

  useEffect(() => {
    const init = async () => {
      try {
        const container = await bootstrapDesktop();
        setStatus({
          dbConnected: container.dbConnected,
          encryptionActive: container.encryptionActive,
          appVersion: APP_VERSION,
        });
        container.backupScheduler.start();
      } catch (err) {
        logger.error('[App] Bootstrap failed', { error: String(err) });
      }
    };
    void init();
  }, []);

  useEffect(() => {
    void dispatch(restoreSession());
  }, [dispatch]);

  const isPlatformAdminView = useMemo(
    () => isAuthenticated && !auth.user?.companyId,
    [isAuthenticated, auth.user],
  );

  useEffect(() => {
    if (isAuthenticated && !isPlatformAdminView) {
      void dispatch(fetchSubscription());
    }
  }, [dispatch, isAuthenticated, isPlatformAdminView]);

  const activeTrialEndsAt = useMemo(() => {
    if (subscription?.trialEndsAt) return new Date(subscription.trialEndsAt);
    return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  }, [subscription?.trialEndsAt]);

  const countdownState = useMemo(
    () => getTrialCountdownState(activeTrialEndsAt),
    [activeTrialEndsAt],
  );

  const selfLockState = useMemo(
    () =>
      checkSelfLock(
        {
          status: (subscription?.status === 'active'
            ? 'active'
            : subscription?.status === 'suspended'
              ? 'suspended'
              : 'trialing') as 'suspended' | 'active' | 'trialing' | 'locked',
          trialEndsAt: activeTrialEndsAt.toISOString(),
          planId: subscription?.planId ?? null,
        },
        new Date(),
      ),
    [subscription, activeTrialEndsAt],
  );

  useEffect(() => {
    if (isPlatformAdminView) { setLockMode(null); return; }
    if (subscription?.status === 'suspended') setLockMode('suspended');
    else if (selfLockState.isLocked) setLockMode('trial_expired');
    else setLockMode(null);
  }, [subscription, selfLockState.isLocked, isPlatformAdminView]);

  const handleLogin = async () => {
    await dispatch(
      login({
        email: username,
        password,
        companyId: isPlatformAdmin ? undefined : companyCode,
        isPlatformAdmin,
      }),
    ).unwrap();
  };

  const handleVerifyMfa = async () => {
    if (auth.challengeToken) {
      await dispatch(
        verifyMfa({ challengeToken: auth.challengeToken, code: mfaCode }),
      ).unwrap();
    }
  };

  const handleSetupMfa = async () => {
    await dispatch(setupMfa({ email: username || auth.user?.email || '', password })).unwrap();
    setShowMfaSetup(true);
  };

  const handleConfirmMfaSetup = async () => {
    if (!auth.mfaSetup?.setupToken) return;
    await dispatch(confirmMfaSetup({ setupToken: auth.mfaSetup.setupToken, code: setupCode })).unwrap();
    setShowMfaSetup(false);
    setSetupCode('');
  };

  const title = isPlatformAdmin ? t('auth.platformAdmin') : t('auth.signInTitle');
  const subtitle = isPlatformAdmin
    ? t('auth.internalTool')
    : t('auth.companyHint');

  return (
    <div dir="rtl">
      {!isAuthenticated ? (
        <AuthShell title={title} subtitle={subtitle} isPlatformAdmin={isPlatformAdmin}>
          {auth.mfaRequired ? (
            <div className="auth-form">
              <p className="auth-subtitle">{t('auth.mfaPrompt')}</p>
              <Field label={t('auth.mfaCode')} htmlFor="mfa-code">
                <input
                  id="mfa-code"
                  className="form-input num"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                />
              </Field>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isLoading || mfaCode.length < 6}
                onClick={handleVerifyMfa}
              >
                {isLoading ? t('common.loading') : t('auth.verify')}
              </button>
              {errorMessage && <div className="error-banner">{errorMessage}</div>}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { dispatch(clearMfaState()); setMfaCode(''); }}
              >
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <div className="auth-form">
              <div className="auth-toggles">
                <button
                  type="button"
                  className={`btn btn-secondary btn-sm${isPlatformAdmin ? ' btn-primary' : ''}`}
                  onClick={() => setIsPlatformAdmin((v) => !v)}
                >
                  <Icon name={isPlatformAdmin ? 'store' : 'shield'} size={16} />
                  {isPlatformAdmin ? t('auth.tenantLogin') : t('auth.platformAdmin')}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm${isOffline ? ' btn-secondary' : ' btn-ghost'}`}
                  onClick={() => setIsOffline((v) => !v)}
                  aria-pressed={isOffline}
                >
                  <Icon name={isOffline ? 'wifi-off' : 'wifi'} size={16} />
                  {isOffline ? t('auth.offline') : t('auth.online')}
                </button>
              </div>

              {!isPlatformAdmin && (
                <Field label={t('auth.companyCode')} htmlFor="company-code">
                  <input
                    id="company-code"
                    className="form-input"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value)}
                    placeholder="company-demo"
                  />
                </Field>
              )}

              <Field label={t('auth.email')} htmlFor="email">
                <input
                  id="email"
                  className="form-input"
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isPlatformAdmin ? 'admin@smartretail.local' : 'user@example.com'}
                />
              </Field>

              <Field label={t('auth.password')} htmlFor="password">
                <input
                  id="password"
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>

              {!isPlatformAdmin && (
                <Field label={t('auth.offlinePin')} htmlFor="pin" hint={t('auth.companyHint')}>
                  <input
                    id="pin"
                    className="form-input num"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="PIN"
                    inputMode="numeric"
                    maxLength={6}
                  />
                </Field>
              )}

              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  isLoading ||
                  !username.trim() ||
                  !password.trim() ||
                  (!isPlatformAdmin && !companyCode.trim())
                }
                onClick={handleLogin}
              >
                {isLoading ? t('common.loading') : t('auth.continue')}
              </button>

              {isPlatformAdmin && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleSetupMfa}>
                  <Icon name="shield" size={16} />
                  {t('auth.mfaSetupTitle')}
                </button>
              )}

              {errorMessage && <div className="error-banner">{errorMessage}</div>}

              {countdownState.isVisible && (
                <div className={`trial-banner${countdownState.isCritical ? ' critical' : ' warning'}`}>
                  {t('system.trialEnds', { days: countdownState.daysRemaining, hours: countdownState.hoursRemaining })}
                </div>
              )}
            </div>
          )}
        </AuthShell>
      ) : isPlatformAdminView ? (
        <PlatformAdminPanel />
      ) : lockMode ? (
        <AuthShell
          title={lockMode === 'suspended' ? t('lock.accountSuspended') : t('lock.trialExpired')}
          subtitle={t('lock.contactAdmin')}
          isPlatformAdmin={false}
        >
          <Paywall mode={lockMode} />
          <button
            type="button"
            className="btn btn-secondary auth-logout-btn"
            onClick={() => dispatch(logout())}
          >
            {t('common.logout')}
          </button>
        </AuthShell>
      ) : (
        <>
          <nav className="top-nav" aria-label="Main">
            <button
              type="button"
              className={`top-nav__item${activeView === 'catalog' ? ' active' : ''}`}
              onClick={() => setActiveView('catalog')}
            >
              <Icon name="package" size={16} /> Catalog
            </button>
            <button
              type="button"
              className={`top-nav__item${activeView === 'purchasing' ? ' active' : ''}`}
              onClick={() => setActiveView('purchasing')}
            >
              <Icon name="shopping-cart" size={16} /> Purchasing
            </button>
              <button
                type="button"
                className={`top-nav__item${activeView === 'customers' ? ' active' : ''}`}
                onClick={() => setActiveView('customers')}
              >
                <Icon name="users" size={16} /> Customers
              </button>
              <button
                type="button"
                className={`top-nav__item${activeView === 'suppliers' ? ' active' : ''}`}
                onClick={() => setActiveView('suppliers')}
              >
                <Icon name="box" size={16} /> Suppliers
              </button>
              <button
                type="button"
                className={`top-nav__item${activeView === 'pos' ? ' active' : ''}`}
                onClick={() => setActiveView('pos')}
              >
                <Icon name="credit-card" size={16} /> POS
              </button>
              <button
                type="button"
                className={`top-nav__item${activeView === 'discounts' ? ' active' : ''}`}
                onClick={() => setActiveView('discounts')}
              >
                <Icon name="tag" size={16} /> Discounts
              </button>
              <button
                type="button"
                className={`top-nav__item${activeView === 'pricing' ? ' active' : ''}`}
                onClick={() => setActiveView('pricing')}
              >
                <Icon name="percent" size={16} /> Pricing
              </button>
          </nav>
          {activeView === 'catalog' ? <CatalogPage /> : activeView === 'purchasing' ? <PurchasingPage /> : activeView === 'customers' ? <CustomerListPage /> : activeView === 'suppliers' ? <SupplierListPage /> : activeView === 'discounts' ? <DiscountsPage /> : activeView === 'pricing' ? <PricingPage /> : <PosRegisterPage />}
          <HealthScreen {...status} />
        </>
      )}

      {/* MFA enrollment (QR) — exposes the server-generated enrollment QR */}
      <Modal
        open={showMfaSetup}
        onClose={() => setShowMfaSetup(false)}
        title={t('auth.mfaSetupTitle')}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setShowMfaSetup(false)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!auth.mfaSetup?.setupToken || setupCode.length < 6}
              onClick={handleConfirmMfaSetup}
            >
              {t('auth.mfaActivate')}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBlockEnd: 'var(--space-4)' }}>
          {t('auth.mfaSetupDesc')}
        </p>
        <div className="row" style={{ justifyContent: 'center', gap: 'var(--space-4)' }}>
          {auth.mfaSetup?.qrCode ? (
            <img
              src={auth.mfaSetup.qrCode}
              alt={t('qr.title')}
              width={172}
              height={172}
              style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)' }}
            />
          ) : (
            <div className="spinner-wrap"><span className="spinner" /></div>
          )}
        </div>
        {auth.mfaSetup?.secret && (
          <div className="field" style={{ marginTop: 'var(--space-4)' }}>
            <span className="section-label">{t('auth.mfaSecret')}</span>
            <code className="num" style={{ display: 'block', padding: 'var(--space-2)', background: 'var(--color-bg-inset)', borderRadius: 'var(--radius-sm)', letterSpacing: '0.1em' }}>
              {auth.mfaSetup.secret}
            </code>
          </div>
        )}
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Field label={t('auth.mfaEnterCode')} htmlFor="mfa-setup-code">
            <input
              id="mfa-setup-code"
              className="form-input num"
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
