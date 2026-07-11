import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { fetchPriceChanges, requestPriceChange, approvePriceChange, rejectPriceChange, clearPriceChangesError } from '../../lib/store/priceChangesSlice';
import { useToast } from '@packages/ui-components';
import { Modal, Field } from '@packages/ui-components';
import { Icon } from '@packages/ui-components';

export function PriceChangePage(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { push } = useToast();
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
      push({ type: 'success', msg: 'Price change requested' });
      resetForm();
      setIsRequestOpen(false);
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await dispatch(approvePriceChange({ id, companyId })).unwrap();
      push({ type: 'success', msg: 'Price change approved' });
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await dispatch(rejectPriceChange({ id, companyId })).unwrap();
      push({ type: 'success', msg: 'Price change rejected' });
    } catch (err) {
      push({ type: 'error', msg: String(err) });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Price Changes</h1>
          <p className="page-subtitle">Request and approve price changes for products.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { resetForm(); setIsRequestOpen(true); }}>
          <Icon name="plus" size={16} /> Request Change
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {pendingApproval.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginBlockStart: 'var(--space-4)' }}>Pending Approval ({pendingApproval.length})</h2>
          <div className="table-container" style={{ marginBlockStart: 'var(--space-2)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Old Price</th>
                  <th>New Price</th>
                  <th>Requested</th>
                  <th>Actions</th>
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
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleApprove(pc.id)}>Approve</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleReject(pc.id)}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="section-title" style={{ marginBlockStart: 'var(--space-4)' }}>All Requests</h2>
      {status === 'loading' && items.length === 0 ? (
        <div className="loading">Loading price changes…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No price changes</p>
          <p>Request a price change to get started.</p>
        </div>
      ) : (
        <div className="table-container" style={{ marginBlockStart: 'var(--space-2)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Old Price</th>
                <th>New Price</th>
                <th>Status</th>
                <th>Requested</th>
              </tr>
            </thead>
            <tbody>
              {items.map((pc: { id: string; productId: string; oldPricePiasters: number; newPricePiasters: number; status: string; requestedAt: string }) => (
                <tr key={pc.id}>
                  <td>{pc.productId}</td>
                  <td className="table-numeric">{(pc.oldPricePiasters / 100).toFixed(2)}</td>
                  <td className="table-numeric">{(pc.newPricePiasters / 100).toFixed(2)}</td>
                  <td>{pc.status === 'pending_approval' ? <span className="badge badge-trialing">Pending</span> : pc.status === 'approved' ? <span className="badge badge-active">Approved</span> : <span className="badge badge-archived">Rejected</span>}</td>
                  <td>{new Date(pc.requestedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isRequestOpen && (
        <Modal open={isRequestOpen} onClose={() => setIsRequestOpen(false)} title="Request Price Change" footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRequestOpen(false)}>Cancel</button>
            <button type="submit" form="price-form" className="btn btn-primary">Submit</button>
          </>
        }>
          <form id="price-form" onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label="Product ID" required htmlFor="pc-product">
              <input id="pc-product" className="form-input" value={productId} onChange={(e) => setProductId(e.target.value)} required />
            </Field>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Field label="Old Price (EGP)" required htmlFor="pc-old">
                <input id="pc-old" className="form-input num" type="number" min={0} step="0.01" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} required />
              </Field>
              <Field label="New Price (EGP)" required htmlFor="pc-new">
                <input id="pc-new" className="form-input num" type="number" min={0.01} step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
              </Field>
            </div>
            <Field label="Notes" htmlFor="pc-notes">
              <textarea id="pc-notes" className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </Field>
            <Field label="Auto-approve Threshold (EGP)" htmlFor="pc-threshold">
              <input id="pc-threshold" className="form-input num" type="number" min={0} step="0.01" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
