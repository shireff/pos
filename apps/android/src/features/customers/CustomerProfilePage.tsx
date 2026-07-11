import React, { useEffect, useState } from 'react';
import { client } from '../../lib/api/client';
import { ApiEndpoints, buildEndpoint } from '../../lib/api/endpoints';

type TabKey = 'overview' | 'loyalty-history' | 'credit-history' | 'purchases';

const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'loyalty-history', label: 'Loyalty History' },
    { key: 'credit-history', label: 'Credit History' },
    { key: 'purchases', label: 'Purchase History' },
];

export interface CustomerProfilePageProps {
    customerId: string;
    onBack: () => void;
}

export function CustomerProfilePage({ customerId, onBack }: CustomerProfilePageProps): React.ReactElement {
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const companyId = 'company-1';

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const endpoint = buildEndpoint(ApiEndpoints.CustomerById, { id: customerId });
                const resp = await client.get(endpoint, { params: { companyId } });
                setDetail(resp.data.data);
            } catch {
                setDetail(null);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [customerId, companyId]);

    if (loading) {
        return <div className="loading">Loading customer profile…</div>;
    }

    if (!detail) {
        return (
            <div className="empty-state">
                <p className="empty-state-title">Customer not found</p>
                <button type="button" className="btn btn-secondary" onClick={onBack}>Back to list</button>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
                            ← Back
                        </button>
                        <h1 className="page-title">{detail.name}</h1>
                    </div>
                    <p className="page-subtitle">{detail.phone} · {detail.email ?? 'No email'}</p>
                </div>
            </div>

            <div className="tab-bar">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                        <div className="stat-card">
                            <span className="stat-label">Loyalty Points</span>
                            <span className="stat-value">{detail.loyaltyAccount?.pointsBalance?.toLocaleString() ?? 0}</span>
                            <span className="stat-meta">Tier: {detail.loyaltyAccount?.tierId ?? 'bronze'}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Credit Balance</span>
                            <span className="stat-value">{(detail.creditLedger?.balancePiasters ?? 0).toLocaleString()} EGP</span>
                            <span className="stat-meta">Limit: {detail.creditLedger?.creditLimitPiasters?.toLocaleString() ?? 0} EGP</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Status</span>
                            <span className="stat-value">{detail.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>
                    <div className="card">
                        <h2 className="card-title">Profile</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                            <div>
                                <span className="section-label">Loyalty Code</span>
                                <p>{detail.loyaltyCode}</p>
                            </div>
                            <div>
                                <span className="section-label">Email</span>
                                <p>{detail.email ?? '—'}</p>
                            </div>
                            <div>
                                <span className="section-label">Created</span>
                                <p>{new Date(detail.createdAt).toLocaleDateString('en-CA')}</p>
                            </div>
                            <div>
                                <span className="section-label">Last Updated</span>
                                <p>{new Date(detail.updatedAt).toLocaleDateString('en-CA')}</p>
                            </div>
                            {detail.notes && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <span className="section-label">Notes</span>
                                    <p>{detail.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab !== 'overview' && (
                <div className="empty-state">
                    <p className="empty-state-title">{activeTab.replace('-', ' ')}</p>
                    <p>This feature is available in the desktop app.</p>
                </div>
            )}
        </div>
    );
}
