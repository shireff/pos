import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { createStockTransfer, submitTransfer, approveTransfer, shipTransfer, receiveTransfer, cancelTransfer } from '../../lib/store/inventorySlice';

type WizardStep = 'warehouses' | 'lines' | 'confirm';

export function StockTransferWizard({ onClose }: { onClose: () => void }): React.ReactElement {
    const dispatch = useAppDispatch();
    const { warehouses } = useAppSelector((state) => state.inventory);

    const [step, setStep] = useState<WizardStep>('warehouses');
    const [form, setForm] = useState({
        fromWarehouseId: '',
        toWarehouseId: '',
        lines: [] as { productId: string; variantId?: string | null; quantityRequested: number }[],
        notes: '',
    });
    const [transferId, setTransferId] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await dispatch(createStockTransfer(form));
        if (createStockTransfer.fulfilled.match(result)) {
            setTransferId(result.payload.id);
            setStep('confirm');
        }
    };

    const handleSubmit = async () => {
        if (!transferId) return;
        await dispatch(submitTransfer(transferId));
        await dispatch(approveTransfer(transferId));
        await dispatch(shipTransfer(transferId));
        await dispatch(receiveTransfer(transferId));
        onClose();
    };

    const handleCancel = async () => {
        if (!transferId) return;
        await dispatch(cancelTransfer(transferId));
        onClose();
    };

    const addLine = () => {
        setForm({
            ...form,
            lines: [...form.lines, { productId: '', variantId: null, quantityRequested: 1 }],
        });
    };

    const removeLine = (index: number) => {
        setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
                <h2 className="modal-title">Stock Transfer</h2>

                {step === 'warehouses' && (
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <div className="form-field">
                            <label className="form-label">From Warehouse</label>
                            <select
                                className="form-select"
                                value={form.fromWarehouseId}
                                onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })}
                                required
                            >
                                <option value="">Select source</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label className="form-label">To Warehouse</label>
                            <select
                                className="form-select"
                                value={form.toWarehouseId}
                                onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })}
                                required
                            >
                                <option value="">Select destination</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Next</button>
                        </div>
                    </form>
                )}

                {step === 'lines' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {form.lines.map((line, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
                                <div className="form-field" style={{ flex: 2 }}>
                                    <label className="form-label">Product ID</label>
                                    <input
                                        className="form-input"
                                        value={line.productId}
                                        onChange={(e) => {
                                            const next = [...form.lines];
                                            next[idx] = { ...next[idx], productId: e.target.value };
                                            setForm({ ...form, lines: next });
                                        }}
                                    />
                                </div>
                                <div className="form-field" style={{ flex: 1 }}>
                                    <label className="form-label">Qty</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        value={line.quantityRequested}
                                        onChange={(e) => {
                                            const next = [...form.lines];
                                            next[idx] = { ...next[idx], quantityRequested: Number(e.target.value) };
                                            setForm({ ...form, lines: next });
                                        }}
                                    />
                                </div>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeLine(idx)}>Remove</button>
                            </div>
                        ))}
                        <button type="button" className="btn btn-secondary" onClick={addLine}>Add Line</button>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setStep('warehouses')}>Back</button>
                            <button type="button" className="btn btn-primary" onClick={() => setStep('confirm')}>Confirm</button>
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <p>From: {form.fromWarehouseId} → To: {form.toWarehouseId}</p>
                        <p>Lines: {form.lines.length}</p>
                        {transferId && <p style={{ color: 'var(--color-success)' }}>Transfer created: {transferId}</p>}
                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setStep('lines')}>Back</button>
                            <button type="button" className="btn btn-danger" onClick={handleCancel}>Cancel</button>
                            <button type="button" className="btn btn-primary" onClick={handleSubmit}>Submit & Complete</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
