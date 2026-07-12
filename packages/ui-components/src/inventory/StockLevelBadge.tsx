import React from 'react';
import { useT } from '../i18n';

export interface StockLevelBadgeProps {
    quantityOnHand: number;
    reservedQuantity?: number;
    reorderPoint?: number;
    showAvailable?: boolean;
    style?: React.CSSProperties;
}

export function StockLevelBadge({
    quantityOnHand,
    reservedQuantity = 0,
    reorderPoint = 0,
    showAvailable = false,
    style,
}: StockLevelBadgeProps): React.ReactElement {
    const t = useT();
    const available = quantityOnHand - reservedQuantity;
    const isBelowReorder = quantityOnHand <= reorderPoint && reorderPoint > 0;

    let color = 'var(--color-text-secondary)';
    let label = `${quantityOnHand}`;

    if (quantityOnHand <= 0) {
        color = 'var(--color-danger)';
        label = t('inventory.outOfStock');
    } else if (isBelowReorder) {
        color = 'var(--color-warning)';
        label = `${t('inventory.low')} (${quantityOnHand})`;
    } else {
        color = 'var(--color-success)';
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', ...style }}>
            <span style={{ color, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {label}
            </span>
            {showAvailable && (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                    ({available} {t('inventory.avail')})
                </span>
            )}
        </div>
    );
}
