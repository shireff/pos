import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { fetchCoupons, createCoupon } from '../../lib/store/promotionsSlice';
import { useToast, Modal, Field, StatusBadge, useT, Icon } from '@packages/ui-components';

export function CouponManagementPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { push } = useToast();
  const t = useT();
  const { coupons, couponStatus, error } = useAppSelector((state: any) => state.promotions);
  const companyId = useAppSelector((state: any) => state.auth.user?.companyId ?? 'company-1');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [amount, setAmount] = useState(0);
  const [isMultiUse, setIsMultiUse] = useState(false);
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState('');
  const [scopeType, setScopeType] = useState<'global' | 'product' | 'category'>('global');
  const [scopeIds, setScopeIds] = useState('');

  useEffect(() => {
    void dispatch(fetchCoupons({ companyId }));
  }, [dispatch, companyId]);

  const resetForm = () => {
    setCode(''); setDiscountType('percentage'); setAmount(0); setIsMultiUse(false);
    setUsageLimit(''); setExpiresAt(''); setScopeType('global'); setScopeIds('');
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!code.trim() || amount <= 0) return;
    try {
      await dispatch(createCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        amount,
        isMultiUse,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        expiresAt: expiresAt || null,
        scopeType,
        scopeIds: scopeIds.split(',').map((s) => s.trim()).filter(Boolean),
        companyId,
      })).unwrap();
      push({ type: 'success', msg: t('discounts.couponCreated') });
      resetForm();
      setIsCreateOpen(false);
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  const isExpired = (coupon: { expiresAt: string | null }) => coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const isExhausted = (coupon: { usageLimit: number | null; usageCount: number }) => coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('coupons.title')}</h1>
          <p className="page-subtitle">{t('coupons.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Icon name="plus" size={16} /> {t('coupons.newCoupon')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {couponStatus === 'loading' && coupons.length === 0 ? (
        <div className="loading">{t('discounts.loadingCoupons')}</div>
      ) : coupons.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">{t('discounts.noCoupons')}</p>
          <p>{t('discounts.createCouponToStart')}</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('coupons.code')}</th>
                <th>{t('coupons.type')}</th>
                <th>{t('coupons.amount')}</th>
                <th>{t('coupons.usage')}</th>
                <th>{t('coupons.expires')}</th>
                <th>{t('coupons.scope')}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon: { id: string; code: string; discountType: string; amount: number; usageCount: number; usageLimit: number | null; isActive: boolean; expiresAt: string | null; scopeType: string }) => (
                <tr key={coupon.id}>
                  <td style={{ fontFamily: 'monospace' }}>{coupon.code}</td>
                  <td>{coupon.discountType}</td>
                  <td className="table-numeric">{coupon.amount} {coupon.discountType === 'percentage' ? '%' : 'EGP'}</td>
                  <td className="table-numeric">{coupon.usageCount} / {coupon.usageLimit ?? '∞'}</td>
                  <td>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : t('discounts.never')}</td>
                  <td>{coupon.scopeType}</td>
                  <td>
                    {!coupon.isActive || isExpired(coupon) || isExhausted(coupon) ? (
                      <StatusBadge status="archived">{t('common.inactive')}</StatusBadge>
                    ) : (
                      <StatusBadge status="active">{t('common.active')}</StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreateOpen && (
        <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t('coupons.createCoupon')} footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" form="coupon-form" className="btn btn-primary">{t('common.save')}</button>
          </>
        }>
          <form id="coupon-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label={t('coupons.code')} required htmlFor="cp-code">
              <input id="cp-code" className="form-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Field label={t('coupons.type')} required htmlFor="cp-type">
                <select id="cp-type" className="form-input" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}>
                  <option value="percentage">{t('discounts.percentage')}</option>
                  <option value="fixed">{t('discounts.fixed')}</option>
                </select>
              </Field>
              <Field label={t('coupons.amount')} required htmlFor="cp-amount">
                <input id="cp-amount" className="form-input num" type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Field label={t('discounts.multiUse')} htmlFor="cp-multi">
                <input id="cp-multi" type="checkbox" checked={isMultiUse} onChange={(e) => setIsMultiUse(e.target.checked)} />
              </Field>
              <Field label={t('discounts.usageLimit')} htmlFor="cp-limit">
                <input id="cp-limit" className="form-input num" type="number" min={1} value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder={t('discounts.unlimitedIfEmpty')} />
              </Field>
            </div>
            <Field label={t('discounts.expiresAt')} htmlFor="cp-expires">
              <input id="cp-expires" className="form-input" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </Field>
            <Field label={t('discounts.scopeType')} required htmlFor="cp-scope-type">
              <select id="cp-scope-type" className="form-input" value={scopeType} onChange={(e) => setScopeType(e.target.value as any)}>
                <option value="global">Global</option>
                <option value="product">Product</option>
                <option value="category">Category</option>
              </select>
            </Field>
            <Field label={t('discounts.scopeIds')} required htmlFor="cp-scope-ids">
              <input id="cp-scope-ids" className="form-input" value={scopeIds} onChange={(e) => setScopeIds(e.target.value)} placeholder={scopeType === 'global' ? t('discounts.ignoredForGlobal') : 'prod-1, prod-2'} />
            </Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
