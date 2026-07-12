import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { fetchPriceChanges, requestPriceChange, approvePriceChange, rejectPriceChange } from '../../lib/store/priceChangesSlice';
import { useToast, Modal, Field, useT, Icon } from '@packages/ui-components';

export function PriceChangePage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { push } = useToast();
  const t = useT();
  const { items, pendingApproval, status, error } = useAppSelector((state: any) => state.priceChanges);
  const companyId = useAppSelector((state: any) => state.auth.user?.companyId ?? 'company-1');

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [threshold, setThreshold] = useState('0');

  useEffect(() => {
    void dispatch(fetchPriceChanges({ companyId }));
  }, [dispatch, companyId]);

  const resetForm = () => {
    setProductId(''); setOldPrice(''); setNewPrice(''); setNotes(''); setThreshold('0');
  };

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!productId.trim() || Number(oldPrice) < 0 || Number(newPrice) <= 0) return;
    try {
      await dispatch(requestPriceChange({
        productId: productId.trim(),
        oldPricePiasters: Number(oldPrice),
        newPricePiasters: Number(newPrice),
        notes: notes.trim() || null,
        autoApproveThresholdPiasters: Number(threshold),
        companyId,
      })).unwrap();
      push({ type: 'success', msg: t('pricing.priceChangeRequested') });
      resetForm();
      setIsRequestOpen(false);
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await dispatch(approvePriceChange({ id, companyId })).unwrap();
      push({ type: 'success', msg: t('pricing.priceChangeApproved') });
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await dispatch(rejectPriceChange({ id, companyId })).unwrap();
      push({ type: 'success', msg: t('pricing.priceChangeRejected') });
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('priceChanges.title')}</h1>
          <p className="page-subtitle">{t('priceChanges.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { resetForm(); setIsRequestOpen(true); }}>
          <Icon name="plus" size={16} /> {t('pricing.requestChange')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {pendingApproval.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginBlockStart: 'var(--space-4)' }}>{t('pricing.pendingApproval')} ({pendingApproval.length})</h2>
          <div className="table-container" style={{ marginBlockStart: 'var(--space-2)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('pricing.product')}</th>
                  <th>{t('pricing.oldPrice')}</th>
                  <th>{t('pricing.newPrice')}</th>
                  <th>{t('pricing.requested')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingApproval.map((pc: { id: string; productId: string; oldPricePiasters: number; newPricePiasters: number; requestedAt: string }) => (
                  <tr key={pc.id}>
                    <td>{pc.productId}</td>
                    <td className="table-numeric">{(pc.oldPricePiasters / 100).toFixed(2)}</td>
                    <td className="table-numeric">{(pc.newPricePiasters / 100).toFixed(2)}</td>
                    <td>{new Date(pc.requestedAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => handleApprove(pc.id)}>{t('pricing.approve')}</button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleReject(pc.id)}>{t('pricing.reject')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="section-title" style={{ marginBlockStart: 'var(--space-4)' }}>{t('pricing.allRequests')}</h2>
      {status === 'loading' && items.length === 0 ? (
        <div className="loading">{t('pricing.loadingPriceChanges')}</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">{t('pricing.noPriceChanges')}</p>
          <p>{t('pricing.requestPriceChangeToStart')}</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-2)' }}>
          <table className="table">
            <thead>
                <tr>
                  <th>{t('pricing.product')}</th>
                  <th>{t('pricing.oldPrice')}</th>
                  <th>{t('pricing.newPrice')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('pricing.requested')}</th>
                </tr>
            </thead>
            <tbody>
              {items.map((pc: { id: string; productId: string; oldPricePiasters: number; newPricePiasters: number; status: string; requestedAt: string }) => (
                <tr key={pc.id}>
                  <td>{pc.productId}</td>
                  <td className="table-numeric">{(pc.oldPricePiasters / 100).toFixed(2)}</td>
                  <td className="table-numeric">{(pc.newPricePiasters / 100).toFixed(2)}</td>
                  <td>{pc.status === 'pending_approval' ? <span className="badge badge-trialing">{t('pricing.pending')}</span> : pc.status === 'approved' ? <span className="badge badge-active">{t('pricing.approved')}</span> : <span className="badge badge-archived">{t('pricing.rejected')}</span>}</td>
                  <td>{new Date(pc.requestedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isRequestOpen && (
        <Modal open={isRequestOpen} onClose={() => setIsRequestOpen(false)} title={t('pricing.requestPriceChange')} footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRequestOpen(false)}>{t('pricing.cancel')}</button>
            <button type="submit" form="price-form" className="btn btn-primary">{t('common.submit')}</button>
          </>
        }>
          <form id="price-form" onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label={t('pricing.product')} required htmlFor="pc-product">
              <input id="pc-product" className="form-input" value={productId} onChange={(e) => setProductId(e.target.value)} required />
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Field label={t('pricing.oldPrice')} required htmlFor="pc-old">
                <input id="pc-old" className="form-input num" type="number" min={0} step="0.01" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} required />
              </Field>
              <Field label={t('pricing.newPrice')} required htmlFor="pc-new">
                <input id="pc-new" className="form-input num" type="number" min={0.01} step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
              </Field>
            </div>
            <Field label={t('common.notes')} htmlFor="pc-notes">
              <textarea id="pc-notes" className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </Field>
            <Field label={t('pricing.autoApproveThreshold')} htmlFor="pc-threshold">
              <input id="pc-threshold" className="form-input num" type="number" min={0} step="0.01" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
