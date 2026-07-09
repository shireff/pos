import React from 'react';

export interface WarehouseSelectorProps {
    warehouses: Array<{ id: string; name: string; address?: string | null }>;
    value?: string;
    onChange: (id: string) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
}

export function WarehouseSelector({
    warehouses,
    value,
    onChange,
    label,
    placeholder = 'Select warehouse',
    disabled,
}: WarehouseSelectorProps): React.ReactElement {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {label && <label className="form-label">{label}</label>}
            <select
                className="form-select"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                <option value="">{placeholder}</option>
                {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                        {w.name}
                        {w.address ? ` — ${w.address}` : ''}
                    </option>
                ))}
            </select>
        </div>
    );
}
