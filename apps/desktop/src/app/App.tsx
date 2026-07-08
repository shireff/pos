import React, { useEffect, useMemo, useState } from 'react';
import {
  AuthShell,
  HealthScreen,
  HealthStatus,
  Paywall,
  getTrialCountdownState,
} from '@packages/ui-components';
import { CatalogPage } from '../features/catalog/CatalogPage';
import { PlatformAdminPanel } from '../features/admin/PlatformAdminPanel';
import { bootstrapDesktop } from '../bootstrap/desktop-bridge';
import { checkSelfLock, logger } from '@packages/shared-kernel';
import { useAppDispatch, useAppSelector } from '../lib/store/hooks';
import type { RootState } from '../lib/store';
import { login, restoreSession, verifyMfa, clearMfaState, logout } from '../lib/store/authSlice';
import { fetchSubscription } from '../lib/store/systemSlice';

const APP_VERSION = process.env.npm_package_version ?? '1.0.0';
const TRIAL_ENDS_AT = new Date('2026-07-20T12:00:00.000Z');

export default function App() {
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
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');
  const [mfaCode, setMfaCode] = useState('');

  const dispatch = useAppDispatch();
  const auth = useAppSelector((state: RootState) => state.auth);
  const system = useAppSelector((state: RootState) => state.system);
  const subscription = system.subscription;

  const isAuthenticated = Boolean(auth.token && auth.user);
  const isLoading = auth.status === 'loading';
  const errorMessage = auth.error;
  const [lockMode, setLockMode] = useState<'trial_expired' | 'suspended' | null>(null);

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

  // Discriminator for type of view
  const isPlatformAdminView = useMemo(() => {
    return isAuthenticated && !auth.user?.companyId;
  }, [isAuthenticated, auth.user]);

  // Load subscription info dynamically when client is logged in
  useEffect(() => {
    if (isAuthenticated && !isPlatformAdminView) {
      void dispatch(fetchSubscription());
    }
  }, [dispatch, isAuthenticated, isPlatformAdminView]);

  const activeTrialEndsAt = useMemo(() => {
    if (subscription?.trialEndsAt) {
      return new Date(subscription.trialEndsAt);
    }
    return TRIAL_ENDS_AT;
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
          planId: subscription?.planId || null,
        },
        new Date(),
      ),
    [subscription, activeTrialEndsAt],
  );

  useEffect(() => {
    if (isPlatformAdminView) {
      setLockMode(null);
      return;
    }

    if (subscription?.status === 'suspended') {
      setLockMode('suspended');
    } else if (selfLockState.isLocked) {
      setLockMode('trial_expired');
    } else {
      setLockMode(null);
    }
  }, [subscription, selfLockState.isLocked, isPlatformAdminView]);

  const title = isPlatformAdmin
    ? language === 'ar'
      ? 'وصول مدير النظام'
      : 'Platform Admin Access'
    : language === 'ar'
      ? 'تسجيل الدخول إلى Smart Retail OS'
      : 'Sign in to Smart Retail OS';

  const subtitle = isPlatformAdmin
    ? language === 'ar'
      ? 'أداة داخلية'
      : 'Internal Tool'
    : language === 'ar'
      ? 'حقول شركة ومستخدم وكلمة مرور ودعم PIN دون اتصال متاحة.'
      : 'Company code, username, password, and offline PIN support are available.';

  const submitLabel = isLoading
    ? language === 'ar'
      ? 'جاري الدخول...'
      : 'Signing in...'
    : language === 'ar'
      ? 'متابعة'
      : 'Continue';

  async function handleLogin() {
    await dispatch(
      login({
        email: username,
        password,
        companyId: isPlatformAdmin ? undefined : companyCode,
        isPlatformAdmin,
      }),
    ).unwrap();
  }

  async function handleVerifyMfa() {
    if (auth.challengeToken) {
      await dispatch(
        verifyMfa({
          challengeToken: auth.challengeToken,
          code: mfaCode,
        }),
      ).unwrap();
    }
  }

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {!isAuthenticated ? (
        <AuthShell title={title} subtitle={subtitle} isPlatformAdmin={isPlatformAdmin}>
          {auth.mfaRequired ? (
            // MFA verification page when Platform Admin challenge is active
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b' }}>
                {language === 'ar'
                  ? 'رمز المصادقة ثنائي العامل (MFA)'
                  : 'MFA Authentication required'}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                {language === 'ar'
                  ? 'برجاء كتابة رمز TOTP المكون من 6 أرقام الخاص بك لتأكيد الهوية ودخول لوحة التحكم الأساسية.'
                  : 'Please enter the 6-digit TOTP code to sign in to the platform console.'}
              </p>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  {language === 'ar' ? 'رمز المصادقة' : 'Auth Code'}
                </span>
                <input
                  style={inputStyle}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="123456"
                />
              </label>
              <button
                type="button"
                style={buttonStyle}
                disabled={isLoading || mfaCode.length < 6}
                onClick={handleVerifyMfa}
              >
                {isLoading
                  ? language === 'ar'
                    ? 'جاري التحقق...'
                    : 'Verifying...'
                  : language === 'ar'
                    ? 'أرسل الرمز'
                    : 'Verify'}
              </button>
              {errorMessage ? (
                <div style={{ color: '#b91c1c', fontSize: '0.95rem' }}>{errorMessage}</div>
              ) : null}
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => {
                  dispatch(clearMfaState());
                  setMfaCode('');
                }}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          ) : (
            // Standard username/password login screen
            <div style={{ display: 'grid', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  style={secondaryButtonStyle}
                  onClick={() => setLanguage((value) => (value === 'en' ? 'ar' : 'en'))}
                >
                  {language === 'en' ? 'العربية' : 'English'}
                </button>
                <button
                  style={secondaryButtonStyle}
                  onClick={() => setIsPlatformAdmin((value) => !value)}
                >
                  {isPlatformAdmin
                    ? language === 'ar'
                      ? 'تسجيل دخول العميل'
                      : 'Tenant Login'
                    : language === 'ar'
                      ? 'مدير النظام'
                      : 'Platform Admin'}
                </button>
                <button
                  type="button"
                  style={{
                    ...secondaryButtonStyle,
                    background: isOffline ? '#fde68a' : '#f1f5f9',
                  }}
                  onClick={() => setIsOffline((value) => !value)}
                >
                  {isOffline
                    ? language === 'ar'
                      ? 'الوضع غير متصل'
                      : 'Offline mode'
                    : language === 'ar'
                      ? 'الوضع المتصل'
                      : 'Online mode'}
                </button>
              </div>
              {!isPlatformAdmin ? (
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    {language === 'ar' ? 'رمز الشركة' : 'Company code'}
                  </span>
                  <input
                    style={inputStyle}
                    value={companyCode}
                    onChange={(event) => setCompanyCode(event.target.value)}
                    placeholder="company-demo"
                  />
                </label>
              ) : null}
              <label style={{ display: 'grid', gap: '6px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </span>
                <input
                  style={inputStyle}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={
                    language === 'ar'
                      ? isPlatformAdmin
                        ? 'admin@smartretail.local'
                        : 'demo@smartretail.local'
                      : isPlatformAdmin
                        ? 'admin@smartretail.local'
                        : 'demo@smartretail.local'
                  }
                />
              </label>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </span>
                <input
                  style={inputStyle}
                  value={password}
                  type="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </label>
              {!isPlatformAdmin ? (
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    {language === 'ar' ? 'PIN دون اتصال' : 'Offline PIN'}
                  </span>
                  <input
                    style={inputStyle}
                    value={pin}
                    onChange={(event) => setPin(event.target.value)}
                    placeholder="PIN"
                  />
                </label>
              ) : null}
              <button
                type="button"
                style={buttonStyle}
                disabled={
                  isLoading ||
                  !username.trim() ||
                  !password.trim() ||
                  (!isPlatformAdmin && !companyCode.trim())
                }
                onClick={handleLogin}
              >
                {submitLabel}
              </button>
              {errorMessage ? (
                <div style={{ color: '#b91c1c', fontSize: '0.95rem' }}>{errorMessage}</div>
              ) : null}
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                {language === 'ar'
                  ? `آخر مزامنة: ${new Date().toISOString()}`
                  : `Last synced: ${new Date().toISOString()}`}
              </div>
              {countdownState.isVisible ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: countdownState.isCritical ? '#fef2f2' : '#fff7ed',
                    color: countdownState.isCritical ? '#b91c1c' : '#9a2c00',
                  }}
                >
                  {language === 'ar'
                    ? `تنتهي الفترة التجريبية بعد ${countdownState.daysRemaining} يوم/أيام و${countdownState.hoursRemaining} ساعة.`
                    : `Trial ends in ${countdownState.daysRemaining} day(s) and ${countdownState.hoursRemaining} hour(s).`}
                </div>
              ) : null}
            </div>
          )}
        </AuthShell>
      ) : isPlatformAdminView ? (
        <PlatformAdminPanel />
      ) : lockMode ? (
        <AuthShell
          title={
            lockMode === 'suspended'
              ? language === 'ar'
                ? 'حساب الشركة مجمد'
                : 'Account Suspended'
              : language === 'ar'
                ? 'انتهت الفترة التجريبية'
                : 'Trial Expired'
          }
          subtitle={
            language === 'ar'
              ? 'يرجى مراجعة إدارة النظام لتنشيط التراخيص.'
              : 'Please contact the system administrator to renew.'
          }
          isPlatformAdmin={false}
        >
          <Paywall mode={lockMode} />
          <button
            type="button"
            onClick={() => dispatch(logout())}
            style={{ ...buttonStyle, marginTop: '20px', width: '100%' }}
          >
            {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </button>
        </AuthShell>
      ) : (
        <>
          <CatalogPage />
          <HealthScreen {...status} />
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  padding: '12px 14px',
  fontSize: '0.95rem',
};

const buttonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: '999px',
  padding: '10px 16px',
  background: '#0f172a',
  color: '#ffffff',
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: '999px',
  padding: '10px 16px',
  background: '#ffffff',
  color: '#0f172a',
  cursor: 'pointer',
};
