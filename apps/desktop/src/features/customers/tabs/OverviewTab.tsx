import React from 'react';
import { Icon } from '@packages/ui-components';
import { CustomerDetail } from '../../../lib/store/customersSlice';

export interface OverviewTabProps {
  detail: CustomerDetail;
}

export function OverviewTab({ detail }: OverviewTabProps): React.ReactElement {
  return (
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
          <span className="stat-value">{detail.status === 'active' ? 'Active' : 'Inactive'}</span>
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
  );
}
