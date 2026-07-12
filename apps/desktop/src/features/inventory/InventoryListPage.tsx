import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { fetchWarehouses, fetchStockMovements } from '../../lib/store/inventorySlice';
import { WarehouseSelector, useT } from '@packages/ui-components';

export function InventoryListPage(): React.ReactElement {
    const t = useT();
    const dispatch = useAppDispatch();
    const { warehouses, movements } = useAppSelector((state) => state.inventory);
    const companyId = useAppSelector((state) => state.auth.user?.companyId ?? 'company-1');

    const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
    const [search, setSearch] = useState('');
    const [belowReorderOnly, setBelowReorderOnly] = useState(false);

    useEffect(() => {
        dispatch(fetchWarehouses());
    }, [dispatch, companyId]);

    useEffect(() => {
        if (selectedWarehouse) {
            dispatch(fetchStockMovements({ warehouseId: selectedWarehouse }));
        }
    }, [dispatch, selectedWarehouse]);

    const filteredMovements = movements.filter((m) => {
        if (!search) return true;
        return JSON.stringify(m).toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="page">
            <div className="page-header">
                <div>
                <h1 className="page-title">{t('inventory.inventory')}</h1>
                <p className="page-subtitle">{t('inventory.stockLevelsAndMovement')}</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                <WarehouseSelector
                    warehouses={warehouses}
                    value={selectedWarehouse}
                    onChange={setSelectedWarehouse}
                    label={t('inventory.warehouse')}
                    placeholder={t('inventory.allWarehouses')}
                />
                <input
                    className="form-input"
                    style={{ maxWidth: 280 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('inventory.searchMovements')}
                    aria-label={t('inventory.searchMovements')}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={belowReorderOnly}
                        onChange={(e) => setBelowReorderOnly(e.target.checked)}
                    />
                    {t('inventory.belowReorderPointOnly')}
                </label>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>{t('inventory.product')}</th>
                            <th>{t('inventory.warehouse')}</th>
                            <th>{t('inventory.type')}</th>
                            <th>{t('common.quantity')}</th>
                            <th>{t('common.date')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMovements.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    {t('inventory.noStockMovements')}
                                </td>
                            </tr>
                        ) : (
                            filteredMovements.map((m) => (
                                <tr key={m.id}>
                                    <td>{m.productVariantId}</td>
                                    <td>{m.warehouseId}</td>
                                    <td>{m.type}</td>
                                    <td>{m.quantity}</td>
                                    <td>{new Date(m.createdAt).toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
