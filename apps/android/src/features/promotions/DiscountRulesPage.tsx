import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { fetchDiscountRules, createDiscountRule, clearPromotionsError } from '../../lib/store/promotionsSlice';
import { useToast } from '@packages/ui-components';
import { Modal, Field } from '@packages/ui-components';
import { Icon } from '@packages/ui-components';

const DISCOUNT_TYPES = ['item', 'cart', 'category', 'customer', 'membership', 'time_based', 'buy_x_get_y', 'quantity_break'] as const;

export function DiscountRulesPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { push } = useToast();
  const { discounts, discountStatus, error } = useAppSelector((state: any) => state.promotions);
  const companyId = useAppSelector((state: any) => state.auth.user?.companyId ?? 'company-1');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('item');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [amount, setAmount] = useState(0);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [priority, setPriority] = useState(0);
  const [isExclusive, setIsExclusive] = useState(false);

  useEffect(() => {
    void dispatch(fetchDiscountRules({ companyId }));
  }, [dispatch, companyId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || amount <= 0) return;
    try {
      await dispatch(createDiscountRule({
        name: name.trim(),
        type,
        ruleJson: { type, discountType, amount, tiers: [] },
        validFrom: validFrom || undefined,
        validUntil: validUntil || undefined,
        priority,
        isExclusive,
        companyId,
      })).unwrap();
      push({ type: 'success', msg: 'Discount rule created' });
      setName(''); setType('item'); setDiscountType('percentage'); setAmount(0);
      setValidFrom(''); setValidUntil(''); setPriority(0); setIsExclusive(false);
      setIsCreateOpen(false);
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Discount Rules</h1>
          <p className="page-subtitle">Create and manage discount rules.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          <Icon name="plus" size={16} /> New
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {discountStatus === 'loading' && discounts.length === 0 ? (
        <div className="loading">Loading…</div>
      ) : discounts.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No discount rules</p>
          <p>Create a rule to start applying discounts.</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((rule: { id: string; name: string; type: string; ruleJson: { amount: number }; isActive: boolean }) => (
                <tr key={rule.id}>
                  <td>{rule.name}</td>
                  <td>{rule.type}</td>
                  <td className="table-numeric">{String(rule.ruleJson.amount ?? 0)}</td>
                  <td>{rule.isActive ? <span className="badge badge-active">Active</span> : <span className="badge badge-archived">Inactive</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreateOpen && (
        <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Discount Rule" footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            <button type="submit" form="dr-form" className="btn btn-primary">Save</button>
          </>
        }>
          <form id="dr-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label="Name" required htmlFor="dr-name">
              <input id="dr-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Type" required htmlFor="dr-type">
              <select id="dr-type" className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
                {DISCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Field label="Discount Type" required htmlFor="dr-dt">
                <select id="dr-dt" className="form-input" value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </Field>
              <Field label="Amount" required htmlFor="dr-amt">
                <input id="dr-amt" className="form-input num" type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
              </Field>
            </div>
            <Field label="Priority" htmlFor="dr-pri">
              <input id="dr-pri" className="form-input num" type="number" min={0} value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
            </Field>
            <Field label="Exclusive" htmlFor="dr-excl">
              <input id="dr-excl" type="checkbox" checked={isExclusive} onChange={(e) => setIsExclusive(e.target.checked)} />
            </Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
