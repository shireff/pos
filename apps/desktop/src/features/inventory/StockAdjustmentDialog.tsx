import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { createStockAdjustment } from '../../lib/store/inventorySlice';

export function StockAdjustmentDialog({
    onClose,
    productId,
    warehouseId,
}: {
    onClose: () => void;
    productId?: string;
    warehouseId?: string;
}): React.ReactElement {
    const dispatch = useAppDispatch();
    const { warehouses } = useAppSelector((state) => state.inventory);

    const [form, setForm] = useState({
        productVariantId: productId ?? '',
        warehouseId: warehouseId ?? '',
        delta: 0,
        reason: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await dispatch(createStockAdjustment(form));
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Stock Adjustment</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div className="form-field">
                        <label className="form-label">Product Variant ID</label>
                        <input
                            className="form-input"
                            value={form.productVariantId}
                            onChange={(e) => setForm({ ...form, productVariantId: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-label">Warehouse</label>
                        <select
                            className="form-select"
                            value={form.warehouseId}
                            onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                            required
                        >
                            <option value="">Select warehouse</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-field">
                        <label className="form-label">Quantity Delta (+/-)</label>
                        <input
                            className="form-input"
                            type="number"
                            value={form.delta}
                            onChange={(e) => setForm({ ...form, delta: Number(e.target.value) })}
                            required
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-label">Reason</label>
                        <textarea
                            className="form-input"
                            value={form.reason}
                            onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Submit Adjustment</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
