'use client';

import { useEffect, useMemo, useState } from 'react';
import { AuthShell, Paywall, getTrialCountdownState } from '@packages/ui-components';
import { CatalogScreen } from '../features/catalog/CatalogScreen';
import { CapacitorHealthBridge } from '../bootstrap/capacitor-health.bridge';
import type { AppHealth } from '../bootstrap/capacitor-health.bridge';
import {
  authReducer,
  clearAuthSession,
  setAuthSession,
  setOfflineStatus,
} from '../store/auth-store';
import {
  getAuthSession,
  removeAuthSession,
  setAuthSessionInStorage,
} from '../lib/storage/secureStorage';
import {
  resetSubscriptionState,
  setSubscriptionState,
  subscriptionReducer,
} from '../store/subscription-store';

const bridge = new CapacitorHealthBridge();
const TRIAL_ENDS_AT = new Date('2026-07-20T12:00:00.000Z');

export default function AndroidHealthPage() {
  const [health, setHealth] = useState<AppHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState(() =>
    authReducer(undefined, { type: 'auth/clear-session' }),
  );
  const [subscriptionState, setSubscriptionStoreState] = useState(() =>
    subscriptionReducer(undefined, { type: 'subscription/reset' }),
  );
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [showPinSheet, setShowPinSheet] = useState(false);

  // Restore persisted session on mount
  useEffect(() => {
    getAuthSession().then((stored) => {
      if (stored) {
        setAuthState((current) =>
          authReducer(
            current,
            setAuthSession({
              currentUser: stored.currentUser,
              accessToken: stored.accessToken,
              branchRoles: stored.branchRoles,
              isAuthenticated: stored.isAuthenticated,
            }),
          ),
        );
      }
    });
  }, []);

  useEffect(() => {
    bridge
      .check()
      .then((result: AppHealth) => setHealth(result))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      });
  }, []);

  useEffect(() => {
    setAuthState((current) =>
      authReducer(current, setOfflineStatus(Boolean(health && health.status !== 'ok'))),
    );
  }, [health]);

  const countdownState = useMemo(() => getTrialCountdownState(TRIAL_ENDS_AT), []);

  const handleContinue = () => {
    const session = {
      currentUser: {
        id: 'android-user',
        name: 'Ahmed',
        email: 'ahmed@example.com',
        companyId: 'company-1',
        defaultBranchId: 'branch-1',
        isActive: true,
      },
      accessToken: 'demo-token',
      branchRoles: ['Owner'],
      isAuthenticated: true,
    };

    setAuthState((current) => authReducer(current, setAuthSession(session)));

    // Persist session to secure storage (Capacitor Preferences → localStorage fallback)
    setAuthSessionInStorage(session);

    setSubscriptionStoreState((current) =>
      subscriptionReducer(
        current,
        setSubscriptionState({
          status: 'trialing',
          trialEndsAt: TRIAL_ENDS_AT.toISOString(),
          planId: 'basic',
          isReadOnlyLocked: false,
          isFullAccessOverride: false,
        }),
      ),
    );
    setShowPinSheet(true);
  };

  const handleLock = () => {
    setSubscriptionStoreState((current) =>
      subscriptionReducer(
        current,
        setSubscriptionState({
          ...current,
          status: 'locked',
          isReadOnlyLocked: true,
        }),
      ),
    );
  };

  const handleLogout = () => {
    setAuthState((current) => authReducer(current, clearAuthSession()));
    setSubscriptionStoreState((current) => subscriptionReducer(current, resetSubscriptionState()));
    setShowPinSheet(false);
    // Clear persisted session from secure storage
    removeAuthSession();
  };

  const shellTitle = isPlatformAdmin
    ? language === 'ar'
      ? 'وصول مدير النظام'
      : 'Platform Admin Access'
    : language === 'ar'
      ? 'تسجيل الدخول إلى Smart Retail OS'
      : 'Sign in to Smart Retail OS';

  const shellSubtitle = isPlatformAdmin
    ? language === 'ar'
      ? 'أداة داخلية'
      : 'Internal Tool'
    : language === 'ar'
      ? 'نظام متوافق مع الدخول دون اتصال، PIN، والاشتراك التجريبي.'
      : 'Offline PIN, trial countdown, and subscription state are available.';

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        gap: '1.5rem',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      }}
    >
      <AuthShell title={shellTitle} subtitle={shellSubtitle} isPlatformAdmin={isPlatformAdmin}>
        <div style={{ display: 'grid', gap: '14px' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
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

          {!authState.isAuthenticated ? (
            <>
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
              <button style={buttonStyle} onClick={handleContinue}>
                {language === 'ar' ? 'متابعة' : 'Continue'}
              </button>
            </>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {/* Catalog shown after successful login */}
              <CatalogScreen />

              <button
                style={secondaryButtonStyle}
                onClick={() => setShowPinSheet((value) => !value)}
              >
                {language === 'ar' ? 'PIN بدون اتصال' : 'Offline PIN'}
              </button>
              <button style={secondaryButtonStyle} onClick={handleLock}>
                {language === 'ar' ? 'تفعيل القفل' : 'Trigger lock'}
              </button>
              <button style={secondaryButtonStyle} onClick={handleLogout}>
                {language === 'ar' ? 'تسجيل الخروج' : 'Log out'}
              </button>
            </div>
          )}

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
                ? `تنتهي الفترة التجريبية خلال ${countdownState.daysRemaining} يوم/أيام و${countdownState.hoursRemaining} ساعة.`
                : `Trial ends in ${countdownState.daysRemaining} day(s) and ${countdownState.hoursRemaining} hour(s).`}
            </div>
          ) : null}

          {authState.isOffline ? (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#fef3c7',
                color: '#92400e',
              }}
            >
              {language === 'ar' ? 'الوضع دون اتصال نشط.' : 'Offline mode is active.'}
            </div>
          ) : null}

          {showPinSheet ? (
            <div
              style={{
                display: 'grid',
                gap: '8px',
                padding: '12px',
                borderRadius: '16px',
                background: '#f8fafc',
              }}
            >
              <div style={{ fontWeight: 700 }}>{language === 'ar' ? 'أدخل PIN' : 'Enter PIN'}</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '8px',
                }}
              >
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((key) => (
                  <button key={key} style={pinButtonStyle}>
                    {key}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {subscriptionState.isReadOnlyLocked ? <Paywall mode="trial_expired" /> : null}
        </div>
      </AuthShell>

      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 16,
          padding: '1.25rem',
          backdropFilter: 'blur(10px)',
        }}
      >
        <h2
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.75rem',
          }}
        >
          {language === 'ar' ? 'حالة النظام' : 'System Status'}
        </h2>

        {error ? (
          <StatusRow
            label={language === 'ar' ? 'خطأ' : 'Error'}
            value={error}
            color="#ef4444"
            icon="❌"
          />
        ) : null}

        {!health && !error ? (
          <StatusRow
            label={language === 'ar' ? 'جارٍ التحميل' : 'Loading'}
            value={language === 'ar' ? 'التحقق من صحة النظام…' : 'Checking system health…'}
            color="#f59e0b"
            icon="⏳"
          />
        ) : null}

        {health ? (
          <>
            <StatusRow
              label={language === 'ar' ? 'الحالة' : 'Status'}
              value={health.status.toUpperCase()}
              color={health.status === 'ok' ? '#22c55e' : '#f59e0b'}
              icon={health.status === 'ok' ? '✅' : '⚠️'}
            />
            <StatusRow
              label={language === 'ar' ? 'المنصة' : 'Platform'}
              value={health.platform}
              color="#94a3b8"
              icon="📱"
            />
            <StatusRow
              label={language === 'ar' ? 'الإصدار' : 'Version'}
              value={`v${health.version}`}
              color="#94a3b8"
              icon="🏷️"
            />
            <StatusRow
              label={language === 'ar' ? 'الوقت' : 'Time'}
              value={new Date(health.timestamp).toLocaleTimeString('ar-EG')}
              color="#94a3b8"
              icon="🕐"
            />
          </>
        ) : null}
      </div>
    </main>
  );
}

function StatusRow({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid rgba(100, 116, 139, 0.15)',
      }}
    >
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <span style={{ fontSize: '0.8rem', color: '#64748b', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.85rem', color, marginLeft: 'auto', fontWeight: 600 }}>
        {value}
      </span>
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

const pinButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: '12px',
  padding: '12px 8px',
  background: '#e2e8f0',
  color: '#0f172a',
  cursor: 'pointer',
  minHeight: '44px',
};
