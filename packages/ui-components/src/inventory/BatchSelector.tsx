import React from 'react';
import { FefoService, NegativeStockGuardService, BatchExpiryGuardService } from '@packages/domain-inventory';
import { Batch } from '@packages/domain-inventory';
import { useT } from '../i18n';

export interface BatchSelectorProps {
    batches: Batch[];
    productId: string;
    warehouseId: string;
    requiredQuantity: number;
    value?: string;
    onChange: (batchId: string | null) => void;
    label?: string;
    disabled?: boolean;
}

export function BatchSelector({
    batches,
    productId,
    warehouseId,
    requiredQuantity,
    value,
    onChange,
    label,
    disabled,
}: BatchSelectorProps): React.ReactElement {
    const t = useT();
    const sorted = FefoService.sortByExpiry(batches);

    const handleChange = (batchId: string) => {
        const batch = sorted.find((b) => b.id === batchId);
        if (!batch) return;

        try {
            BatchExpiryGuardService.verify(batch, productId);
            NegativeStockGuardService.verify(batch.quantityRemaining, requiredQuantity, productId, warehouseId);
            onChange(batchId);
        } catch (error) {
            onChange(batchId);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {label && <label className="form-label">{label}</label>}
            <select
                className="form-select"
                value={value ?? ''}
                onChange={(e) => handleChange(e.target.value)}
                disabled={disabled}
            >
                <option value="">{t('inventory.noBatch')}</option>
                {sorted.map((b) => {
                    const expired = b.isExpired();
                    const insufficient = b.quantityRemaining < requiredQuantity;
                    const label = `${b.batchNumber}${b.expiryDate ? ` (${t('inventory.expiryAbbr')} ${new Date(b.expiryDate).toLocaleDateString()})` : ''} — ${t('common.qtyAbbr')}: ${b.quantityRemaining}`;
                    return (
                        <option key={b.id} value={b.id} disabled={expired || insufficient}>
                            {label}
                            {expired ? ` [${t('inventory.expired')}]` : ''}
                            {insufficient && !expired ? ` [${t('inventory.low')}]` : ''}
                        </option>
                    );
                })}
            </select>
        </div>
    );
}
