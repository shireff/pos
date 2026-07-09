import React, { useEffect, useState } from 'react';
import { useT, Icon, StatusBadge, Modal, Field } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
  fetchPurchaseOrder,
  submitPurchaseOrder,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  cancelPurchaseOrder,
  type PurchaseOrder,
} from '../../lib/store/purchasingSlice';
import { GoodsReceiptScreen } from './GoodsReceiptScreen';
import { OcrUpload } from './OcrUpload';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending approval',
  approved: 'Approved',
  partially_received: 'Partially received',
  fully_received: 'Fully received',
  cancelled: 'Cancelled',
};

const TIMELINE: Array<{ status: string; label: string }> = [
  { status: 'draft', label: 'Created' },
  { status: 'pending_approval', label: 'Submitted' },
  { status: 'approved', label: 'Approved' },
  { status: 'fully_received', label: 'Received' },
];

export function PurchaseOrderDetailPage({
  purchaseOrderId,
  onBack,
}: {
  purchaseOrderId: string;
  onBack: () => void;
}): React.ReactElement {
  const t = useT();
  const dispatch = useAppDispatch();
  const po = useAppSelector((s) => s.purchasing.currentPurchaseOrder) as PurchaseOrder | null;
  const companyId = useAppSelector((s) => s.auth.user?.companyId ?? 'company-1');

  const [showReceive, setShowReceive] = useState(false);
  const [showReason, setShowReason] = useState<null | 'reject' | 'cancel'>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPurchaseOrder(purchaseOrderId));
  }, [dispatch, purchaseOrderId]);

  if (!po || po.id !== purchaseOrderId) {
    return (
      <div className="page">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="arrow-right" size={16} /> Back</button>
        <p style={{ marginTop: 16 }}>Loading purchase order…</p>
      </div>
    );
  }

  const canSubmit = po.status === 'draft';
  const canApprove = po.status === 'pending_approval';
  const canReceive = po.status === 'approved' || po.status === 'partially_received';
  const canCancel = !['fully_received', 'cancelled'].includes(po.status);

  const runReasonAction = async () => {
    setError(null);
    try {
      if (showReason === 'reject') {
        await dispatch(rejectPurchaseOrder({ id: po!.id, reason })).unwrap();
      } else if (showReason === 'cancel') {
        await dispatch(cancelPurchaseOrder({ id: po!.id, reason })).unwrap();
      }
      setShowReason(null);
      setReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 8 }}>
            <Icon name="arrow-right" size={16} /> Back
          </button>
          <h1 className="page-title">
            {po.referenceNumber} <StatusBadge status={po.status}>{STATUS_LABELS[po.status] ?? po.status}</StatusBadge>
          </h1>
          <p className="page-subtitle">
            Supplier {po.supplierId} · Expected {new Date(po.expectedDeliveryDate).toLocaleDateString()}
          </p>
        </div>
        <div className="po-actions">
          {canSubmit && (
            <button className="btn btn-primary btn-sm" onClick={() => dispatch(submitPurchaseOrder({ id: po.id }))}>
              Submit
            </button>
          )}
          {canApprove && (
            <button className="btn btn-primary btn-sm" onClick={() => dispatch(approvePurchaseOrder(po.id))}>
              Approve
            </button>
          )}
          {canReceive && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowReceive(true)}>
              <Icon name="package" size={14} /> Receive goods
            </button>
          )}
          {canCancel && (
            <button className="btn btn-danger btn-sm" onClick={() => setShowReason('cancel')}>
              Cancel
            </button>
          )}
          {po.status === 'pending_approval' && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowReason('reject')}>
              Reject
            </button>
          )}
        </div>
      </div>

      {po.rejectedReason && (
        <div className="info-banner">Rejected: {po.rejectedReason}</div>
      )}
      {po.cancelledReason && (
        <div className="info-banner">Cancelled: {po.cancelledReason}</div>
      )}

      <div className="po-timeline">
        {TIMELINE.map((step, i) => {
          const active = TIMELINE.findIndex((s) => s.status === po.status) >= i || po.status === 'cancelled';
          return (
            <div key={step.status} className={`po-timeline__step${active ? ' is-active' : ''}`}>
              <span className="po-timeline__dot" />
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3 className="section-label">Lines</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Ordered</th>
                <th>Received</th>
                <th>Unit price</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((l) => {
                const pct = l.orderedQuantity ? Math.round((l.receivedQuantity / l.orderedQuantity) * 100) : 0;
                return (
                  <tr key={l.id}>
                    <td>{l.productId}</td>
                    <td className="num">{l.orderedQuantity}</td>
                    <td className="num">{l.receivedQuantity}</td>
                    <td className="num">{(l.unitPricePiasters / 100).toFixed(2)} EGP</td>
                    <td>
                      <div className="progress"><div className="progress__bar" style={{ width: `${pct}%` }} /></div>
                      {l.receivedQuantity < l.orderedQuantity && (
                        <span className="badge badge-suspended">discrepancy</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="po-form__total">Total: {(po.totalAmountPiasters / 100).toFixed(2)} EGP</div>
      </div>

      <div className="card">
        <h3 className="section-label">Invoice</h3>
        <OcrUpload purchaseOrderId={po.id} companyId={companyId} />
      </div>

      <Modal
        open={showReceive}
        onClose={() => setShowReceive(false)}
        title="Receive Goods"
        footer={<button className="btn btn-ghost" onClick={() => setShowReceive(false)}>Close</button>}
      >
        <GoodsReceiptScreen purchaseOrder={po} onDone={() => setShowReceive(false)} />
      </Modal>

      <Modal
        open={showReason !== null}
        onClose={() => setShowReason(null)}
        title={showReason === 'reject' ? 'Reject Purchase Order' : 'Cancel Purchase Order'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowReason(null)}>Close</button>
            <button className="btn btn-danger" onClick={runReasonAction} disabled={reason.trim().length < 1}>
              Confirm
            </button>
          </>
        }
      >
        <Field label={showReason === 'reject' ? 'Rejection reason (min 10 chars)' : 'Cancellation reason'}>
          <textarea className="form-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {showReason === 'reject' && reason.trim().length < 10 && (
          <p className="field-hint" style={{ color: 'var(--color-danger)' }}>Reason must be at least 10 characters.</p>
        )}
        {error && <div className="error-banner">{error}</div>}
      </Modal>

      {error && showReason === null && showReceive === false && <div className="error-banner">{error}</div>}
    </div>
  );
}
