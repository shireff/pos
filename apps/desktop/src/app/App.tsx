import React, { useEffect, useMemo, useState } from 'react';
import {
  AuthShell,
  HealthScreen,
  HealthStatus,
  Paywall,
  getTrialCountdownState,
} from '@packages/ui-components';
import { bootstrapDesktop } from '../bootstrap/desktop-bridge';
import { checkSelfLock, logger } from '@packages/shared-kernel';

const APP_VERSION = process.env.npm_package_version ?? '1.0.0';
const TRIAL_ENDS_AT = new Date('2026-07-20T12:00:00.000Z');

export default function App() {
  const [status, setStatus] = useState<HealthStatus>({
    dbConnected: false,
    encryptionActive: false,
    appVersion: APP_VERSION,
  });
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');
  const [isReadOnly, setIsReadOnly] = useState(false);
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

  const countdownState = useMemo(() => getTrialCountdownState(TRIAL_ENDS_AT), []);
  const selfLockState = useMemo(
    () =>
      checkSelfLock(
        {
          status: 'trialing',
          trialEndsAt: TRIAL_ENDS_AT.toISOString(),
          planId: null,
        },
        new Date(),
      ),
    [],
  );

  useEffect(() => {
    if (!isOffline) {
      setLockMode(null);
      return;
    }

    if (selfLockState.isLocked) {
      setLockMode('trial_expired');
    }
  }, [isOffline, selfLockState.isLocked]);

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

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AuthShell title={title} subtitle={subtitle} isPlatformAdmin={isPlatformAdmin}>
        {lockMode ? (
          <Paywall mode={lockMode} />
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
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
            </div>
            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {language === 'ar' ? 'رمز الشركة' : 'Company code'}
              </span>
              <input style={inputStyle} placeholder="ACME" />
            </label>
            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {language === 'ar' ? 'اسم المستخدم' : 'Username'}
              </span>
              <input style={inputStyle} placeholder="owner" />
            </label>
            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </span>
              <input style={inputStyle} type="password" placeholder="••••••••" />
            </label>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <button style={buttonStyle}>{language === 'ar' ? 'متابعة' : 'Continue'}</button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={secondaryButtonStyle}
                  onClick={() => setIsOffline((value) => !value)}
                >
                  {isOffline
                    ? language === 'ar'
                      ? 'الاتصال متاح'
                      : 'Online'
                    : language === 'ar'
                      ? 'وضع عدم الاتصال'
                      : 'Offline mode'}
                </button>
                <button
                  style={secondaryButtonStyle}
                  onClick={() => setIsReadOnly((value) => !value)}
                >
                  {isReadOnly
                    ? language === 'ar'
                      ? 'الوضع العادي'
                      : 'Normal mode'
                    : language === 'ar'
                      ? 'وضع القراءة فقط'
                      : 'Read-only mode'}
                </button>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.9rem',
                color: '#64748b',
                gap: '12px',
              }}
            >
              <span>{language === 'ar' ? 'PIN بدون اتصال' : 'Offline PIN'}</span>
              <span>
                {language === 'ar' ? 'آخر مزامنة' : 'Last synced'}: {new Date().toISOString()}
              </span>
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
            {isOffline ? (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#fef3c7',
                  color: '#92400e',
                }}
              >
                {language === 'ar'
                  ? 'الوضع بدون اتصال نشط. يتم قفل الكتابة حتى إعادة الاتصال.'
                  : 'Offline mode is active. Writes are locked until the device reconnects.'}
              </div>
            ) : null}
            {isReadOnly ? (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                }}
              >
                {language === 'ar'
                  ? 'أنت تشاهد البيانات بصيغة قراءة فقط.'
                  : 'You are viewing historical data in read-only mode.'}
              </div>
            ) : null}
          </div>
        )}
      </AuthShell>
      <HealthScreen {...status} />
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
