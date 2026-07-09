import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { createStockAdjustment } from '../../lib/store/inventorySlice';
import { WarehouseSelector } from '@packages/ui-components';

export function StockAdjustmentSheet({
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
        const result = await dispatch(createStockAdjustment(form));
        if (createStockAdjustment.fulfilled.match(result)) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    top: 'auto',
                    maxWidth: 'none',
                    margin: 0,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                }}
            >
                <h2 className="modal-title">Stock Adjustment</h2>
                <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
                >
                    <div className="form-field">
                        <label className="form-label">Product Variant ID</label>
                        <input
                            className="form-input"
                            value={form.productVariantId}
                            onChange={(e) => setForm({ ...form, productVariantId: e.target.value })}
                            required
                        />
                    </div>
                    <WarehouseSelector
                        warehouses={warehouses}
                        value={form.warehouseId}
                        onChange={(id) => setForm({ ...form, warehouseId: id })}
                        label="Warehouse"
                        placeholder="Select warehouse"
                    />
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
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Submit Adjustment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
