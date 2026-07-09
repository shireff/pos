import React from 'react';

export function TransferDetailPage({ transfer }: { transfer: any }): React.ReactElement {
    if (!transfer) {
        return (
            <div className="page">
                <div className="empty-state">
                    <p>No transfer selected.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Transfer {transfer.id}</h1>
                    <p className="page-subtitle">From {transfer.fromWarehouseId} to {transfer.toWarehouseId}</p>
                </div>
                <span className={`badge badge-${transfer.status === 'received' ? 'active' : transfer.status === 'cancelled' ? 'archived' : 'draft'}`}>
                    {transfer.status}
                </span>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <h2 className="card-title">Lines</h2>
                {transfer.lines?.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>No lines.</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Requested</th>
                                <th>Shipped</th>
                                <th>Received</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfer.lines.map((line: any) => (
                                <tr key={line.id}>
                                    <td>{line.productId}</td>
                                    <td>{line.quantityRequested}</td>
                                    <td>{line.quantityShipped}</td>
                                    <td>{line.quantityReceived}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
