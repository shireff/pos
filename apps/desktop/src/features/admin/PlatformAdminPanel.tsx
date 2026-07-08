import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchAccounts,
  fetchAccountDetail,
  changePlan,
  suspendAccount,
  reactivateAccount,
  extendTrial,
  selectAccount,
} from '../../lib/store/platformAdminSlice';
import { logout } from '../../lib/store/authSlice';

export function PlatformAdminPanel() {
  const dispatch = useAppDispatch();
  const { accounts, selectedAccount, status } = useAppSelector((state) => state.platformAdmin);
  const currentUser = useAppSelector((state) => state.auth.user);

  const [reason, setReason] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [trialDays, setTrialDays] = useState(7);
  const [activeModal, setActiveModal] = useState<
    'plan' | 'suspend' | 'reactivate' | 'extend' | null
  >(null);

  useEffect(() => {
    void dispatch(fetchAccounts());
  }, [dispatch]);

  const handleSelectAccount = (companyId: string) => {
    dispatch(selectAccount(companyId));
    void dispatch(fetchAccountDetail(companyId));
  };

  const handleAction = async () => {
    if (!selectedAccount) return;
    const companyId = selectedAccount.companyId;

    try {
      if (activeModal === 'plan') {
        await dispatch(changePlan({ companyId, planId: selectedPlan, reason })).unwrap();
      } else if (activeModal === 'suspend') {
        await dispatch(suspendAccount({ companyId, reason })).unwrap();
      } else if (activeModal === 'reactivate') {
        await dispatch(reactivateAccount({ companyId, reason })).unwrap();
      } else if (activeModal === 'extend') {
        const newTrialDate = new Date();
        newTrialDate.setDate(newTrialDate.getDate() + Number(trialDays));
        await dispatch(
          extendTrial({ companyId, newTrialEndsAt: newTrialDate.toISOString(), reason }),
        ).unwrap();
      }
      // Re-fetch detail to capture change
      void dispatch(fetchAccountDetail(companyId));
      setReason('');
      setActiveModal(null);
    } catch (e) {
      alert(`Action failed: ${String(e)}`);
    }
  };

  return (
    <div style={panelContainer}>
      {/* Top Navbar */}
      <header style={headerNav}>
        <div style={logoSection}>
          <div style={logoIcon}>Ω</div>
          <div>
            <div style={navTitle}>Smart Retail OS</div>
            <div style={navSubtitle}>منصة إدارة النظام والعملاء (Platform Admin)</div>
          </div>
        </div>
        <div style={authIndicator}>
          <div style={badgeStyle}>Super Admin</div>
          <span style={userEmail}>{currentUser?.email}</span>
          <button type="button" onClick={() => dispatch(logout())} style={logoutBtn}>
            تسجيل خروج
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div style={gridBody}>
        {/* Left column: Company accounts list */}
        <section style={accountsListSection}>
          <div style={sectionHeader}>
            <h3>حسابات الشركات (Tenants)</h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              إجمالي الشركات: {accounts.length}
            </span>
          </div>
          {status === 'loading' && accounts.length === 0 ? (
            <div style={loaderStyle}>جاري التحميل...</div>
          ) : (
            <div style={listScroll}>
              {accounts.map((ac) => {
                const isActive = selectedAccount?.companyId === ac.companyId;
                return (
                  <button
                    key={ac.companyId}
                    onClick={() => handleSelectAccount(ac.companyId)}
                    style={isActive ? activeCardStyle : cardStyle}
                  >
                    <div style={cardHeaderRow}>
                      <span style={companyNameText}>{ac.name}</span>
                      <span style={statusBadgeStyle(ac.subscription.status)}>
                        {ac.subscription.status}
                      </span>
                    </div>
                    <div style={cardFooterRow}>
                      <span>كود الشركة: {ac.companyId}</span>
                      <span>باقة: {ac.subscription.planId || 'تجريبية'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Right column: Action panel / Details */}
        <section style={accountDetailSection}>
          {selectedAccount ? (
            <div style={detailWidget}>
              <div style={detailGridHeader}>
                <h2>تفاصيل الشركة: {selectedAccount.name}</h2>
                <p>مراجعة بيانات الاشتراك الحالي وتجاوزات رخص الاستخدام</p>
              </div>

              <div style={infoGrid}>
                <div style={infoItem}>
                  <span style={infoLabel}>رمز الشركة الفريد (UUID)</span>
                  <span style={infoVal}>{selectedAccount.companyId}</span>
                </div>
                <div style={infoItem}>
                  <span style={infoLabel}>طبيعة النشاط التجاري</span>
                  <span style={infoVal}>{selectedAccount.businessType || 'retail'}</span>
                </div>
                <div style={infoItem}>
                  <span style={infoLabel}>مشترك منذ تاريخ</span>
                  <span style={infoVal}>
                    {new Date(selectedAccount.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <div style={infoItem}>
                  <span style={infoLabel}>تاريخ انتهاء الفترة التجريبية</span>
                  <span style={{ ...infoVal, color: '#f59e0b' }}>
                    {new Date(selectedAccount.subscription.trialEndsAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <div style={infoItem}>
                  <span style={infoLabel}>فئة الباقة الحالية</span>
                  <span style={infoVal}>{selectedAccount.subscription.planId || 'Free Trial'}</span>
                </div>
                <div style={infoItem}>
                  <span style={infoLabel}>حالة الاشتراك</span>
                  <span style={statusBadgeStyle(selectedAccount.subscription.status)}>
                    {selectedAccount.subscription.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div style={actionBlock}>
                <h3>التحكم في التراخيص وحالة الاشتراك</h3>
                <div style={actionRow}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlan(selectedAccount.subscription.planId || 'pro');
                      setActiveModal('plan');
                    }}
                    style={actionBtn('#0f172a')}
                  >
                    تغيير الباقة (Plan Override)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTrialDays(7);
                      setActiveModal('extend');
                    }}
                    style={actionBtn('#0284c7')}
                  >
                    تمديد التجربة (Trial Extend)
                  </button>
                  {selectedAccount.subscription.status === 'suspended' ? (
                    <button
                      type="button"
                      onClick={() => setActiveModal('reactivate')}
                      style={actionBtn('#16a34a')}
                    >
                      إلغاء التجميد والتفعيل (Reactivate)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveModal('suspend')}
                      style={actionBtn('#dc2626')}
                    >
                      تجميد الحساب وإيقافه (suspend)
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={emptyStateStyle}>يرجى تحديد شركة من القائمة الجانبية لإدارتها.</div>
          )}
        </section>
      </div>

      {/* Modal Overlay */}
      {activeModal && selectedAccount && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>
              {activeModal === 'plan' && 'تعديل الباقة / الترخيص'}
              {activeModal === 'extend' && 'تمديد الفترة التجريبية مجاناً للعميل'}
              {activeModal === 'suspend' && 'تأكيد تجميد حساب الشركة'}
              {activeModal === 'reactivate' && 'تأكيد استعادة وتنشيط حساب الشركة'}
            </h3>
            <p style={{ margin: '8px 0 16px', color: '#64748b' }}>
              العملية تجري للشركة: <strong>{selectedAccount.name}</strong> (
              {selectedAccount.companyId})
            </p>

            {activeModal === 'plan' && (
              <label style={modalLabel}>
                اختر الباقة البديلة:
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  style={modalSelect}
                >
                  <option value="basic">Basic (باقة أساسية)</option>
                  <option value="pro">Pro (باقة متقدمة)</option>
                  <option value="enterprise">Enterprise (باقة الشركات الكبرى)</option>
                </select>
              </label>
            )}

            {activeModal === 'extend' && (
              <label style={modalLabel}>
                عدد أيام التمديد الإضافية:
                <input
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(Number(e.target.value))}
                  style={modalInput}
                  min={1}
                />
              </label>
            )}

            <label style={modalLabel}>
              سبب العمل المرفق (مطلوب لأرشفة التدقيق):
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="أدخل سبباً تفصيلياً..."
                style={modalTextarea}
                required
              />
            </label>

            <div style={modalActionRow}>
              <button
                type="button"
                onClick={handleAction}
                disabled={!reason.trim()}
                style={confirmBtn(activeModal === 'suspend' ? '#dc2626' : '#0f172a')}
              >
                تأكيد العملية
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setReason('');
                }}
                style={cancelBtn}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline CSS styles for sleek modern premium interface
const panelContainer: React.CSSProperties = {
  backgroundColor: '#0b0f19',
  color: '#f8fafc',
  minHeight: '100vh',
  fontFamily: 'Inter, Segoe UI, Tahoma, sans-serif',
  display: 'flex',
  flexDirection: 'column',
};

const headerNav: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px',
  background: '#111827',
  borderBottom: '1px solid #1f2937',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
};

const logoSection: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const logoIcon: React.CSSProperties = {
  backgroundColor: '#3b82f6',
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '1.25rem',
  fontWeight: 'bold',
  color: '#fff',
  boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
};

const navTitle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '1.1rem',
};

const navSubtitle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '0.8rem',
};

const authIndicator: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: '#ef4444',
  color: '#fff',
  fontSize: '0.75rem',
  fontWeight: 700,
  padding: '4px 8px',
  borderRadius: '999px',
};

const userEmail: React.CSSProperties = {
  color: '#cbd5e1',
  fontSize: '0.85rem',
};

const logoutBtn: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#f3f4f6',
  border: '1px solid #374151',
  padding: '8px 14px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

const gridBody: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '350px 1fr',
  flex: 1,
  height: 'calc(100vh - 71px)',
};

const accountsListSection: React.CSSProperties = {
  background: '#0d1525',
  borderLeft: '1px solid #1e293b',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  overflow: 'hidden',
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const listScroll: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  overflowY: 'auto',
  flex: 1,
  paddingLeft: '4px',
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  padding: '14px',
  cursor: 'pointer',
  textAlign: 'right',
  color: '#f8fafc',
  transition: 'transform 0.2s, background-color 0.2s',
};

const activeCardStyle: React.CSSProperties = {
  ...cardStyle,
  background: '#1e3a8a',
  border: '1px solid #3b82f6',
  boxShadow: '0 0 10px rgba(59, 130, 246, 0.25)',
};

const cardHeaderRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const companyNameText: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.95rem',
};

const cardFooterRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.75rem',
  color: '#94a3b8',
};

const statusBadgeStyle = (status: string) => {
  let bg = '#1e293b';
  let color = '#94a3b8';
  if (status === 'active') {
    bg = '#166534';
    color = '#4ade80';
  } else if (status === 'suspended') {
    bg = '#7f1d1d';
    color = '#fca5a5';
  } else if (status === 'trial_expired') {
    bg = '#78350f';
    color = '#fcd34d';
  } else if (status === 'trialing') {
    bg = '#134e5a';
    color = '#67e8f9';
  }
  return {
    backgroundColor: bg,
    color,
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '6px',
  };
};

const accountDetailSection: React.CSSProperties = {
  padding: '30px',
  overflowY: 'auto',
  background: '#090d16',
};

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  color: '#64748b',
  fontSize: '1.1rem',
};

const detailWidget: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '20px',
  padding: '30px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
};

const detailGridHeader: React.CSSProperties = {
  borderBottom: '1px solid #334155',
  paddingBottom: '18px',
  marginBottom: '24px',
};

const infoGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '20px',
};

const infoItem: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  backgroundColor: '#1b2234',
  padding: '14px 18px',
  borderRadius: '12px',
  border: '1px solid #2e374d',
};

const infoLabel: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '0.8rem',
  fontWeight: 500,
};

const infoVal: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
};

const actionBlock: React.CSSProperties = {
  marginTop: '36px',
  borderTop: '1px solid #334155',
  paddingTop: '24px',
};

const actionRow: React.CSSProperties = {
  marginTop: '16px',
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
};

const actionBtn = (color: string): React.CSSProperties => ({
  backgroundColor: color,
  color: '#fff',
  border: 'none',
  padding: '12px 20px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  transition: 'opacity 0.2s',
});

const loaderStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#64748b',
  padding: '20px',
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContent: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #475569',
  padding: '30px',
  borderRadius: '20px',
  width: '480px',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
};

const modalLabel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  margin: '16px 0',
  direction: 'rtl',
  fontWeight: 600,
};

const modalSelect: React.CSSProperties = {
  padding: '10px',
  borderRadius: '8px',
  background: '#0f172a',
  color: '#fff',
  border: '1px solid #475569',
};

const modalInput: React.CSSProperties = {
  padding: '10px',
  borderRadius: '8px',
  background: '#0f172a',
  color: '#fff',
  border: '1px solid #475569',
};

const modalTextarea: React.CSSProperties = {
  padding: '10px',
  borderRadius: '8px',
  background: '#0f172a',
  color: '#fff',
  border: '1px solid #475569',
  height: '80px',
  resize: 'none',
};

const modalActionRow: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginTop: '24px',
};

const confirmBtn = (color: string): React.CSSProperties => ({
  backgroundColor: color,
  color: '#fff',
  border: 'none',
  padding: '10px 18px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
});

const cancelBtn: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#cbd5e1',
  border: '1px solid #475569',
  padding: '10px 18px',
  borderRadius: '8px',
  cursor: 'pointer',
};
