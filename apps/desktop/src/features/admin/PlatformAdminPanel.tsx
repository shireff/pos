import { useEffect, useState } from 'react';
import { useT, Icon } from '@packages/ui-components';
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
import '../../styles/platform-admin.css';

type ModalMode = 'plan' | 'suspend' | 'reactivate' | 'extend' | null;

const STATUS_CLASS: Record<string, string> = {
  active: 'admin-status-active',
  suspended: 'admin-status-suspended',
  trial_expired: 'admin-status-trial_expired',
  trialing: 'admin-status-trialing',
  past_due: 'admin-status-past_due',
};

function statusBadge(status: string) {
  const cls = STATUS_CLASS[status] ?? 'admin-status-trialing';
  return <span className={`admin-status-badge ${cls}`}>{status}</span>;
}

export function PlatformAdminPanel() {
  const t = useT();
  const dispatch = useAppDispatch();
  const { accounts, selectedAccount, status, error } = useAppSelector(
    (state) => state.platformAdmin,
  );
  const currentUser = useAppSelector((state) => state.auth.user);

  const [reason, setReason] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [trialDays, setTrialDays] = useState(7);
  const [activeModal, setActiveModal] = useState<ModalMode>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchAccounts());
  }, [dispatch]);

  const handleSelectAccount = (companyId: string) => {
    dispatch(selectAccount(companyId));
    void dispatch(fetchAccountDetail(companyId));
  };

  const handleAction = async () => {
    if (!selectedAccount) return;
    const { companyId } = selectedAccount;
    setActionError(null);

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
      void dispatch(fetchAccountDetail(companyId));
      setReason('');
      setActiveModal(null);
    } catch (err) {
      setActionError(String(err));
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setReason('');
    setActionError(null);
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-logo-section">
          <div className="admin-logo-icon" aria-hidden="true"><Icon name="store" size={22} /></div>
          <div>
            <div className="admin-app-name">Smart Retail OS</div>
            <div className="admin-app-subtitle">
              منصة إدارة النظام والعملاء
            </div>
          </div>
        </div>
        <div className="admin-header-actions">
          <span className="admin-super-badge">مشرف عام</span>
          <span className="admin-user-email">{currentUser?.email}</span>
          <button
            type="button"
            className="admin-logout-btn"
            onClick={() => void dispatch(logout())}
          >
            {t('common.logout')}
          </button>
        </div>
      </header>

      <div className="admin-body">
        <section className="admin-accounts-sidebar" aria-label="حسابات الشركات">
          <div className="admin-sidebar-header">
            <h2 className="admin-sidebar-title">حسابات الشركات</h2>
            <span className="admin-sidebar-count">إجمالي: {accounts.length}</span>
          </div>

          {status === 'loading' && accounts.length === 0 ? (
            <div className="admin-loader">{t('common.loading')}</div>
          ) : (
            <div className="admin-accounts-list" role="list">
              {accounts.map((ac) => (
                <button
                  key={ac.companyId}
                  type="button"
                  role="listitem"
                  className={`admin-account-card${
                    selectedAccount?.companyId === ac.companyId ? ' active' : ''
                  }`}
                  onClick={() => handleSelectAccount(ac.companyId)}
                  aria-pressed={selectedAccount?.companyId === ac.companyId}
                >
                  <div className="admin-account-card-header">
                    <span className="admin-account-name">{ac.name}</span>
                    {statusBadge(ac.subscription.status)}
                  </div>
                  <div className="admin-account-card-footer">
                    <span>{ac.companyId}</span>
                    <span>{ac.subscription.planId || 'تجريبية'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && <div className="admin-error">{error}</div>}
        </section>

        <section className="admin-detail-panel" aria-label="تفاصيل الحساب">
          {!selectedAccount ? (
            <div className="admin-empty-detail">
              يرجى تحديد شركة من القائمة لإدارتها.
            </div>
          ) : (
            <div className="admin-detail-card">
              <div className="admin-detail-heading">
                <h2 className="admin-detail-title">
                  تفاصيل الشركة: {selectedAccount.name}
                </h2>
                <p className="admin-detail-subtitle">
                  مراجعة بيانات الاشتراك الحالي وتجاوزات رخص الاستخدام
                </p>
              </div>

              <div className="admin-info-grid">
                <div className="admin-info-item">
                  <span className="admin-info-label">رمز الشركة الفريد</span>
                  <span className="admin-info-value">{selectedAccount.companyId}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">طبيعة النشاط التجاري</span>
                  <span className="admin-info-value">
                    {selectedAccount.businessType || 'retail'}
                  </span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">مشترك منذ</span>
                  <span className="admin-info-value">
                    {new Date(selectedAccount.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">انتهاء الفترة التجريبية</span>
                  <span className="admin-info-value admin-info-value--warning">
                    {new Date(
                      selectedAccount.subscription.trialEndsAt,
                    ).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">الباقة الحالية</span>
                  <span className="admin-info-value">
                    {selectedAccount.subscription.planId || 'تجريبية'}
                  </span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">حالة الاشتراك</span>
                  {statusBadge(selectedAccount.subscription.status)}
                </div>
              </div>

              {actionError && <div className="admin-error">{actionError}</div>}

              <div className="admin-actions-section">
                <h3 className="admin-actions-title">
                  التحكم في التراخيص وحالة الاشتراك
                </h3>
                <div className="admin-actions-row">
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--neutral"
                    onClick={() => {
                      setSelectedPlan(
                        selectedAccount.subscription.planId || 'pro',
                      );
                      setActiveModal('plan');
                    }}
                  >
                    تغيير الباقة
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--blue"
                    onClick={() => {
                      setTrialDays(7);
                      setActiveModal('extend');
                    }}
                  >
                    تمديد الفترة التجريبية
                  </button>
                  {selectedAccount.subscription.status === 'suspended' ? (
                    <button
                      type="button"
                      className="admin-action-btn admin-action-btn--green"
                      onClick={() => setActiveModal('reactivate')}
                    >
                      إلغاء التجميد
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-action-btn admin-action-btn--red"
                      onClick={() => setActiveModal('suspend')}
                    >
                      تجميد الحساب
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {activeModal && selectedAccount && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-modal-title"
        >
          <div className="admin-modal">
            <h2 id="admin-modal-title" className="admin-modal-title">
              {activeModal === 'plan' && 'تعديل الباقة / الترخيص'}
              {activeModal === 'extend' && 'تمديد الفترة التجريبية'}
              {activeModal === 'suspend' && 'تأكيد تجميد الحساب'}
              {activeModal === 'reactivate' && 'تأكيد استعادة الحساب'}
            </h2>
            <p className="admin-modal-subtitle">
              العملية تجري للشركة:{' '}
              <strong>{selectedAccount.name}</strong>{' '}
              ({selectedAccount.companyId})
            </p>

            {activeModal === 'plan' && (
              <label className="admin-modal-field">
                اختر الباقة البديلة:
                <select
                  className="admin-modal-select"
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                >
                  <option value="basic">الباقة الأساسية (Basic)</option>
                  <option value="pro">الباقة المتقدمة (Pro)</option>
                  <option value="enterprise">باقة الشركات الكبرى (Enterprise)</option>
                </select>
              </label>
            )}

            {activeModal === 'extend' && (
              <label className="admin-modal-field">
                عدد أيام التمديد:
                <input
                  type="number"
                  className="admin-modal-input"
                  value={trialDays}
                  min={1}
                  onChange={(e) => setTrialDays(Number(e.target.value))}
                />
              </label>
            )}

            <label className="admin-modal-field">
              سبب العملية (مطلوب لأرشفة التدقيق):
              <textarea
                className="admin-modal-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="أدخل سبباً تفصيلياً…"
                required
              />
            </label>

            {actionError && <div className="admin-error">{actionError}</div>}

            <div className="admin-modal-footer">
              <button
                type="button"
                className={`admin-confirm-btn ${
                  activeModal === 'suspend'
                    ? 'admin-confirm-btn--danger'
                    : 'admin-confirm-btn--neutral'
                }`}
                disabled={!reason.trim()}
                onClick={handleAction}
              >
                {t('common.confirm')}
              </button>
              <button
                type="button"
                className="admin-cancel-btn"
                onClick={closeModal}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
