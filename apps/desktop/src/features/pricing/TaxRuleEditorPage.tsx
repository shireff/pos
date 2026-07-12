import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { fetchTaxRules, createTaxRule } from '../../lib/store/taxRulesSlice';
import { useToast, Modal, Field, useT, Icon } from '@packages/ui-components';

export function TaxRuleEditorPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { push } = useToast();
  const t = useT();
  const { rules, status, error } = useAppSelector((state: any) => state.taxRules);
  const companyId = useAppSelector((state: any) => state.auth.user?.companyId ?? 'company-1');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [ratePercent, setRatePercent] = useState(14);
  const [appliesTo, setAppliesTo] = useState<'all' | 'category' | 'product'>('all');
  const [scopeIds, setScopeIds] = useState('');
  const [priority, setPriority] = useState(0);

  useEffect(() => {
    void dispatch(fetchTaxRules({ companyId }));
  }, [dispatch, companyId]);

  const resetForm = () => {
    setName(''); setRatePercent(14); setAppliesTo('all'); setScopeIds(''); setPriority(0);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || ratePercent < 0 || ratePercent > 100) return;
    try {
      await dispatch(createTaxRule({
        name: name.trim(),
        rateBasisPoints: Math.round(ratePercent * 100),
        appliesTo,
        scopeIds: scopeIds.split(',').map((s) => s.trim()).filter(Boolean),
        priority,
        companyId,
      })).unwrap();
      push({ type: 'success', msg: t('pricing.taxRuleCreated') });
      resetForm();
      setIsCreateOpen(false);
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  const sorted = [...rules].sort((a, b) => a.priority - b.priority);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('taxRules.title')}</h1>
          <p className="page-subtitle">{t('taxRules.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Icon name="plus" size={16} /> {t('taxRules.createRule')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {status === 'loading' && rules.length === 0 ? (
        <div className="loading">{t('pricing.loadingTaxRules')}</div>
      ) : rules.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">{t('pricing.noTaxRules')}</p>
          <p>{t('pricing.createTaxRulesToCalculate')}</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('common.priority')}</th>
                <th>{t('common.name')}</th>
                <th>{t('pricing.rate')}</th>
                <th>{t('pricing.appliesTo')}</th>
                <th>{t('pricing.scopeIds')}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((rule) => (
                <tr key={rule.id}>
                  <td className="table-numeric">{rule.priority}</td>
                  <td>{rule.name}</td>
                  <td className="table-numeric">{(rule.rateBasisPoints / 100).toFixed(2)}%</td>
                  <td>{rule.appliesTo}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>{rule.scopeIds.join(', ')}</td>
                  <td>{rule.isActive ? <span className="badge badge-active">Active</span> : <span className="badge badge-archived">Inactive</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreateOpen && (
        <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t('taxRules.createRule')} footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" form="tax-form" className="btn btn-primary">{t('common.save')}</button>
          </>
        }>
          <form id="tax-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label={t('common.name')} required htmlFor="tr-name">
              <input id="tr-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Field label={t('pricing.rate')} required htmlFor="tr-rate">
                <input id="tr-rate" className="form-input num" type="number" min={0} max={100} step="0.01" value={ratePercent} onChange={(e) => setRatePercent(Number(e.target.value))} required />
              </Field>
              <Field label={t('common.priority')} htmlFor="tr-priority">
                <input id="tr-priority" className="form-input num" type="number" min={0} value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
              </Field>
            </div>
            <Field label={t('pricing.appliesTo')} required htmlFor="tr-applies">
              <select id="tr-applies" className="form-input" value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as any)}>
                <option value="all">All Items</option>
                <option value="category">By Category</option>
                <option value="product">By Product</option>
              </select>
            </Field>
            <Field label={t('pricing.scopeIds')} htmlFor="tr-scope">
              <input id="tr-scope" className="form-input" value={scopeIds} onChange={(e) => setScopeIds(e.target.value)} placeholder={appliesTo === 'all' ? 'Ignored for all' : 'cat-1, cat-2'} />
            </Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
