import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { fetchWarehouses, fetchStockMovements } from '../../lib/store/inventorySlice';
import { WarehouseSelector } from '@packages/ui-components';

export function InventoryListPage(): React.ReactElement {
    const dispatch = useAppDispatch();
    const { warehouses, movements } = useAppSelector((state) => state.inventory);

    const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
    const [search, setSearch] = useState('');
    const [belowReorderOnly, setBelowReorderOnly] = useState(false);

    useEffect(() => {
        dispatch(fetchWarehouses());
    }, [dispatch]);

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
                    <h1 className="page-title">Inventory</h1>
                    <p className="page-subtitle">Stock levels and movement history.</p>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    flexWrap: 'wrap',
                    marginBottom: 'var(--space-4)',
                }}
            >
                <WarehouseSelector
                    warehouses={warehouses}
                    value={selectedWarehouse}
                    onChange={setSelectedWarehouse}
                    label="Warehouse"
                    placeholder="All warehouses"
                />
                <input
                    className="form-input"
                    style={{ maxWidth: 280 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search movements"
                    aria-label="Search movements"
                />
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        cursor: 'pointer',
                    }}
                >
                    <input
                        type="checkbox"
                        checked={belowReorderOnly}
                        onChange={(e) => setBelowReorderOnly(e.target.checked)}
                    />
                    Below reorder point only
                </label>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Warehouse</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMovements.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    style={{
                                        textAlign: 'center',
                                        color: 'var(--color-text-secondary)',
                                    }}
                                >
                                    No stock movements found.
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
