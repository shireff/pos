import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { fetchTaxRules, createTaxRule } from '../../lib/store/taxRulesSlice';
import { useToast } from '@packages/ui-components';
import { Modal, Field } from '@packages/ui-components';
import { Icon } from '@packages/ui-components';

export function TaxRulesPage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { push } = useToast();
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
      push({ type: 'success', msg: 'Tax rule created' });
      setName(''); setRatePercent(14); setAppliesTo('all'); setScopeIds(''); setPriority(0);
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
          <h1 className="page-title">Tax Rules</h1>
          <p className="page-subtitle">Configure tax rates.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          <Icon name="plus" size={16} /> New
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {status === 'loading' && rules.length === 0 ? (
        <div className="loading">Loading…</div>
      ) : rules.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No tax rules</p>
          <p>Create tax rules to calculate taxes.</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-3)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Name</th>
                <th>Rate</th>
                <th>Applies To</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((rule) => (
                <tr key={rule.id}>
                  <td className="table-numeric">{rule.priority}</td>
                  <td>{rule.name}</td>
                  <td className="table-numeric">{(rule.rateBasisPoints / 100).toFixed(2)}%</td>
                  <td>{rule.appliesTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreateOpen && (
        <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Tax Rule" footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            <button type="submit" form="tr-form" className="btn btn-primary">Save</button>
          </>
        }>
          <form id="tr-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label="Name" required htmlFor="tr-name">
              <input id="tr-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Field label="Rate (%)" required htmlFor="tr-rate">
                <input id="tr-rate" className="form-input num" type="number" min={0} max={100} step="0.01" value={ratePercent} onChange={(e) => setRatePercent(Number(e.target.value))} required />
              </Field>
              <Field label="Priority" htmlFor="tr-pri">
                <input id="tr-pri" className="form-input num" type="number" min={0} value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
              </Field>
            </div>
            <Field label="Applies To" required htmlFor="tr-to">
              <select id="tr-to" className="form-input" value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as any)}>
                <option value="all">All Items</option>
                <option value="category">By Category</option>
                <option value="product">By Product</option>
              </select>
            </Field>
            <Field label="Scope IDs (comma-separated)" htmlFor="tr-scope">
              <input id="tr-scope" className="form-input" value={scopeIds} onChange={(e) => setScopeIds(e.target.value)} />
            </Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
