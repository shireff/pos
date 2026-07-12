import React, { useEffect, useState } from 'react';
import { StatusBadge, Modal, Field, Icon, WarehouseSelector } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
    fetchPurchaseOrder,
    submitPurchaseOrder,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    cancelPurchaseOrder,
    receivePurchaseOrder,
    uploadInvoiceOcr,
    recordSupplierInvoice,
    clearOcrResult,
    type PurchaseOrder,
    type OcrInvoiceResult,
} from '../../lib/store/purchasingSlice';
import { fetchWarehouses } from '../../lib/store/inventorySlice';

const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    pending_approval: 'Pending',
    approved: 'Approved',
    partially_received: 'Partial',
    fully_received: 'Received',
    cancelled: 'Cancelled',
};

export function PurchaseOrderDetailPage({
    purchaseOrderId,
    onBack,
}: {
    purchaseOrderId: string;
    onBack: () => void;
}): React.ReactElement {
    const dispatch = useAppDispatch();
    const po = useAppSelector((s) => s.purchasing.currentPurchaseOrder) as PurchaseOrder | null;
    const warehouses = useAppSelector((s) => s.inventory.warehouses);

    const [showReceive, setShowReceive] = useState(false);
    const [showReason, setShowReason] = useState<null | 'reject' | 'cancel'>(null);
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [warehouseId, setWarehouseId] = useState('');
    const [fileReference, setFileReference] = useState('');
    const [editable, setEditable] = useState<OcrInvoiceResult | null>(null);
    const [ocrMessage, setOcrMessage] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchPurchaseOrder(purchaseOrderId));
        dispatch(fetchWarehouses());
    }, [dispatch, purchaseOrderId]);

    if (!po || po.id !== purchaseOrderId) {
        return (
            <div className="page">
                <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="arrow-right" size={16} /> Back</button>
                <p style={{ marginTop: 16 }}>Loading…</p>
            </div>
        );
    }

    const canSubmit = po.status === 'draft';
    const canApprove = po.status === 'pending_approval';
    const canReceive = po.status === 'approved' || po.status === 'partially_received';
    const canCancel = !['fully_received', 'cancelled'].includes(po.status);

    const runReason = async () => {
        setError(null);
        try {
            if (showReason === 'reject') await dispatch(rejectPurchaseOrder({ id: po!.id, reason })).unwrap();
            else await dispatch(cancelPurchaseOrder({ id: po!.id, reason })).unwrap();
            setShowReason(null);
            setReason('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Action failed');
        }
    };

    const doReceive = async () => {
        setError(null);
        if (!warehouseId) {
            setError('Select a warehouse first.');
            return;
        }
        const lines = po.lines.map((l) => ({
            lineId: l.id,
            warehouseId,
            receivedQuantity: l.orderedQuantity,
            discrepancyType: null,
            discrepancyNotes: null,
        }));
        try {
            await dispatch(receivePurchaseOrder({ id: po.id, lines })).unwrap();
            setShowReceive(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to receive goods');
        }
    };

    const extractOcr = async () => {
        setOcrMessage(null);
        if (!fileReference.trim()) {
            setOcrMessage('Choose an invoice image first.');
            return;
        }
        try {
            const extracted = await dispatch(
                uploadInvoiceOcr({ id: po!.id, fileReference: fileReference.trim() }),
            ).unwrap();
            setEditable(extracted);
        } catch (e) {
            setOcrMessage(e instanceof Error ? e.message : 'OCR failed');
        }
    };

    const applyInvoice = async () => {
        if (!editable) return;
        try {
            await dispatch(
                recordSupplierInvoice({
                    id: po!.id,
                    supplierId: po!.supplierId || 'ocr-supplier',
                    invoiceNumber: editable.invoiceNumber,
                    invoiceDate: editable.invoiceDate,
                    totalAmountPiasters: Math.round(editable.totalAmountPiasters),
                    taxAmountPiasters: 0,
                }),
            ).unwrap();
            setOcrMessage('Supplier invoice recorded from OCR data.');
            setEditable(null);
            dispatch(clearOcrResult());
        } catch (e) {
            setOcrMessage(e instanceof Error ? e.message : 'Failed to record invoice');
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
                    <p className="page-subtitle">Supplier {po.supplierId}</p>
                </div>
            </div>

            <div className="po-actions" style={{ marginBottom: 'var(--space-4)' }}>
                {canSubmit && (
                    <button className="btn btn-primary btn-sm" onClick={() => dispatch(submitPurchaseOrder({ id: po.id }))}>Submit</button>
                )}
                {canApprove && (
                    <button className="btn btn-primary btn-sm" onClick={() => dispatch(approvePurchaseOrder(po.id))}>Approve</button>
                )}
                {canReceive && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowReceive(true)}>Receive</button>
                )}
                {canCancel && (
                    <button className="btn btn-danger btn-sm" onClick={() => setShowReason('cancel')}>Cancel</button>
                )}
                {po.status === 'pending_approval' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowReason('reject')}>Reject</button>
                )}
            </div>

            <div className="card">
                <h3 className="section-label">Lines</h3>
                {po.lines.map((l) => (
                    <div className="receipt-line" key={l.id}>
                        <div className="receipt-line__head">
                            <span>{l.productId}</span>
                            <span className="num">{l.receivedQuantity}/{l.orderedQuantity}</span>
                        </div>
                        <div className="progress">
                            <div
                                className="progress__bar"
                                style={{ width: `${l.orderedQuantity ? Math.round((l.receivedQuantity / l.orderedQuantity) * 100) : 0}%` }}
                            />
                        </div>
                    </div>
                ))}
                <div className="po-form__total">Total: {(po.totalAmountPiasters / 100).toFixed(2)} EGP</div>
            </div>

            <div className="card">
                <h3 className="section-label">Invoice (OCR)</h3>
                <div className="ocr-upload__row">
                    <input
                        className="form-input"
                        value={fileReference}
                        onChange={(e) => setFileReference(e.target.value)}
                        placeholder="invoice.png"
                    />
                    <button className="btn btn-secondary btn-sm" onClick={extractOcr}><Icon name="scan" size={14} /> Extract</button>
                </div>
                {editable && (
                    <div className="ocr-panel">
                        <Field label="Invoice number">
                            <input className="form-input" value={editable.invoiceNumber} onChange={(e) => setEditable({ ...editable, invoiceNumber: e.target.value })} />
                        </Field>
                        <Field label="Invoice date">
                            <input className="form-input" value={editable.invoiceDate} onChange={(e) => setEditable({ ...editable, invoiceDate: e.target.value })} />
                        </Field>
                        <Field label="Total (piasters)">
                            <input className="form-input num" value={editable.totalAmountPiasters} onChange={(e) => setEditable({ ...editable, totalAmountPiasters: Number(e.target.value) })} inputMode="numeric" />
                        </Field>
                        <button className="btn btn-primary btn-sm" onClick={applyInvoice}>Record supplier invoice</button>
                    </div>
                )}
                {ocrMessage && <div className="info-banner">{ocrMessage}</div>}
            </div>

            <Modal
                open={showReceive}
                onClose={() => setShowReceive(false)}
                title="Receive Goods"
                footer={<button className="btn btn-ghost" onClick={() => setShowReceive(false)}>Close</button>}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <WarehouseSelector
                        warehouses={warehouses}
                        value={warehouseId}
                        onChange={setWarehouseId}
                        label="Receiving warehouse"
                        placeholder="Select warehouse"
                    />
                    {po.lines.map((l) => (
                        <div className="receipt-line" key={l.id}>
                            <div className="receipt-line__head">
                                <span>{l.productId}</span>
                                <span className="num">ordered {l.orderedQuantity}</span>
                            </div>
                        </div>
                    ))}
                    <button className="btn btn-primary btn-block" onClick={doReceive}>Confirm receipt</button>
                </div>
            </Modal>

            <Modal
                open={showReason !== null}
                onClose={() => setShowReason(null)}
                title={showReason === 'reject' ? 'Reject' : 'Cancel'}
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setShowReason(null)}>Close</button>
                        <button className="btn btn-danger" onClick={runReason} disabled={reason.trim().length < 1}>Confirm</button>
                    </>
                }
            >
                <Field label={showReason === 'reject' ? 'Reason (min 10 chars)' : 'Reason'}>
                    <textarea className="form-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
                {error && <div className="error-banner">{error}</div>}
            </Modal>

            {error && showReason === null && showReceive === false && <div className="error-banner">{error}</div>}
        </div>
    );
}
