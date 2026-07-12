import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { fetchCoupons, createCoupon } from '../../lib/store/promotionsSlice';
import { useToast } from '@packages/ui-components';
import { Modal, Field } from '@packages/ui-components';
import { Icon } from '@packages/ui-components';

export function CouponsPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { push } = useToast();
  const { coupons, couponStatus, error } = useAppSelector((state: any) => state.promotions);
  const companyId = useAppSelector((state: any) => state.auth.user?.companyId ?? 'company-1');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [amount, setAmount] = useState(0);
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState('');
  const [scopeType, setScopeType] = useState<'global' | 'product' | 'category'>('global');
  const [scopeIds, setScopeIds] = useState('');

  useEffect(() => {
    void dispatch(fetchCoupons({ companyId }));
  }, [dispatch, companyId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!code.trim() || amount <= 0) return;
    try {
      await dispatch(createCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        amount,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        expiresAt: expiresAt || null,
        scopeType,
        scopeIds: scopeIds.split(',').map((s) => s.trim()).filter(Boolean),
        companyId,
      })).unwrap();
      push({ type: 'success', msg: 'Coupon created' });
      setCode(''); setDiscountType('percentage'); setAmount(0); setUsageLimit(''); setExpiresAt('');
      setScopeType('global'); setScopeIds('');
      setIsCreateOpen(false);
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  const isExpired = (c: { expiresAt: string | null }) => c.expiresAt && new Date(c.expiresAt) < new Date();
  const isExhausted = (c: { usageLimit: number | null; usageCount: number }) => c.usageLimit !== null && c.usageCount >= c.usageLimit;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Coupons</h1>
          <p className="page-subtitle">Manage coupon codes.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          <Icon name="plus" size={16} /> New
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {couponStatus === 'loading' && coupons.length === 0 ? (
        <div className="loading">Loading…</div>
      ) : coupons.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No coupons</p>
          <p>Create a coupon to offer discounts.</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Usage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon: { id: string; code: string; discountType: string; amount: number; usageCount: number; usageLimit: number | null; isActive: boolean; expiresAt: string | null }) => (
                <tr key={coupon.id}>
                  <td style={{ fontFamily: 'monospace' }}>{coupon.code}</td>
                  <td>{coupon.discountType}</td>
                  <td className="table-numeric">{coupon.amount}</td>
                  <td className="table-numeric">{coupon.usageCount} / {coupon.usageLimit ?? '∞'}</td>
                  <td>{!coupon.isActive || isExpired(coupon) || isExhausted(coupon) ? <span className="badge badge-archived">Inactive</span> : <span className="badge badge-active">Active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreateOpen && (
        <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Coupon" footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            <button type="submit" form="cp-form" className="btn btn-primary">Save</button>
          </>
        }>
          <form id="cp-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label="Code" required htmlFor="cp-code">
              <input id="cp-code" className="form-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Field label="Discount Type" required htmlFor="cp-type">
                <select id="cp-type" className="form-input" value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </Field>
              <Field label="Amount" required htmlFor="cp-amount">
                <input id="cp-amount" className="form-input num" type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
              </Field>
            </div>
            <Field label="Usage Limit" htmlFor="cp-limit">
              <input id="cp-limit" className="form-input num" type="number" min={1} value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited if empty" />
            </Field>
            <Field label="Expires At" htmlFor="cp-exp">
              <input id="cp-exp" className="form-input" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </Field>
            <Field label="Scope Type" required htmlFor="cp-scope">
              <select id="cp-scope" className="form-input" value={scopeType} onChange={(e) => setScopeType(e.target.value as any)}>
                <option value="global">Global</option>
                <option value="product">Product</option>
                <option value="category">Category</option>
              </select>
            </Field>
            <Field label="Scope IDs (comma-separated)" htmlFor="cp-ids">
              <input id="cp-ids" className="form-input" value={scopeIds} onChange={(e) => setScopeIds(e.target.value)} placeholder={scopeType === 'global' ? 'Ignored for global' : 'id-1, id-2'} />
            </Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
