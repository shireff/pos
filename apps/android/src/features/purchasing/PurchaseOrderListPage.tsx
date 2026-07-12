import React, { useEffect, useState } from 'react';
import { StatusBadge, Modal, Field, Icon } from '@packages/ui-components';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import {
    fetchPurchaseOrders,
    createPurchaseOrder,
    type PurchaseOrder,
} from '../../lib/store/purchasingSlice';
import { PurchaseOrderDetailPage } from './PurchaseOrderDetailPage';

const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    pending_approval: 'Pending',
    approved: 'Approved',
    partially_received: 'Partial',
    fully_received: 'Received',
    cancelled: 'Cancelled',
};

export function PurchaseOrderListPage(): React.ReactElement {
    const dispatch = useAppDispatch();
    const { purchaseOrders, status } = useAppSelector((s) => s.purchasing);
    const companyId = useAppSelector((s) => s.auth.user?.companyId ?? 'company-1');

    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    // form state
    const [supplierId, setSupplierId] = useState('');
    const [productId, setProductId] = useState('');
    const [unitId, setUnitId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unitPrice, setUnitPrice] = useState('0');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchPurchaseOrders());
    }, [dispatch]);

    const openDetail = (id: string) => {
        setSelectedId(id);
        setView('detail');
    };

    const submit = async () => {
        setError(null);
        const qty = Number(quantity);
        const price = Number(unitPrice);
        if (!supplierId.trim() || !productId.trim() || !unitId.trim()) {
            setError('Supplier, product and unit are required.');
            return;
        }
        if (!Number.isInteger(qty) || qty <= 0) {
            setError('Quantity must be a positive whole number.');
            return;
        }
        try {
            const po = await dispatch(
                createPurchaseOrder({
                    companyId,
                    branchId: 'branch-1',
                    supplierId: supplierId.trim(),
                    expectedDeliveryDate: new Date().toISOString(),
                    notes: null,
                    lines: [
                        {
                            productId: productId.trim(),
                            variantId: null,
                            unitId: unitId.trim(),
                            orderedQuantity: qty,
                            unitPricePiasters: Math.round(price),
                        },
                    ],
                }),
            ).unwrap();
            setShowForm(false);
            setSupplierId('');
            setProductId('');
            setUnitId('');
            setQuantity('1');
            setUnitPrice('0');
            openDetail((po as unknown as PurchaseOrder).id);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create purchase order');
        }
    };

    if (view === 'detail' && selectedId) {
        return (
            <PurchaseOrderDetailPage
                purchaseOrderId={selectedId}
                onBack={() => {
                    setView('list');
                    setSelectedId(null);
                    dispatch(fetchPurchaseOrders());
                }}
            />
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Purchase Orders</h1>
                    <p className="page-subtitle">Supplier orders and receipts.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                    <Icon name="plus" size={16} /> New
                </button>
            </div>

            <div className="po-list">
                {status === 'loading' && purchaseOrders.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>
                ) : purchaseOrders.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>No purchase orders yet.</p>
                ) : (
                    purchaseOrders.map((po: PurchaseOrder) => (
                        <button
                            key={po.id}
                            className="po-card"
                            style={{ textAlign: 'start', width: '100%' }}
                            onClick={() => openDetail(po.id)}
                        >
                            <div className="po-card__top">
                                <span className="num">{po.referenceNumber}</span>
                                <StatusBadge status={po.status}>{STATUS_LABELS[po.status] ?? po.status}</StatusBadge>
                            </div>
                            <div className="po-card__meta">
                                <span>{po.supplierId}</span>
                                <span className="num">{(po.totalAmountPiasters / 100).toFixed(2)} EGP</span>
                            </div>
                        </button>
                    ))
                )}
            </div>

            <Modal
                open={showForm}
                onClose={() => setShowForm(false)}
                title="New Purchase Order"
                footer={<button className="btn btn-ghost" onClick={() => setShowForm(false)}>Close</button>}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <Field label="Supplier ID">
                        <input className="form-input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} placeholder="supplier-…" />
                    </Field>
                    <Field label="Product ID">
                        <input className="form-input" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="product-…" />
                    </Field>
                    <Field label="Unit ID">
                        <input className="form-input" value={unitId} onChange={(e) => setUnitId(e.target.value)} placeholder="unit-…" />
                    </Field>
                    <Field label="Quantity">
                        <input className="form-input num" value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="numeric" />
                    </Field>
                    <Field label="Unit price (piasters)">
                        <input className="form-input num" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} inputMode="numeric" />
                    </Field>
                    <button className="btn btn-primary btn-block" onClick={submit}>Create</button>
                    {error && <div className="error-banner">{error}</div>}
                </div>
            </Modal>
        </div>
    );
}
