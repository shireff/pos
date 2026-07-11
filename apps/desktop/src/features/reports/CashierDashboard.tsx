import React from 'react';
import { ReportsPage } from './ReportsPage';

export function CashierDashboard({ isOffline = false }: { isOffline?: boolean }): React.ReactElement {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cashier Dashboard</h1>
          <p className="page-subtitle">My shift summary, my sales stats, current shift progress.</p>
        </div>
      </div>
      {isOffline && (
        <div className="offline-banner" style={{ padding: 'var(--space-2)', background: 'var(--color-warning)', color: 'var(--color-text-inverse)', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
          Offline — data limited to local branch
        </div>
      )}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>My Shift Summary</h3>
          <p>Current shift summary available in Reports.</p>
        </div>
        <div className="dashboard-card">
          <h3>My Sales Stats</h3>
          <p>Sales statistics available in Reports.</p>
        </div>
        <div className="dashboard-card">
          <h3>Current Shift Progress</h3>
          <p>Shift progress placeholder.</p>
        </div>
      </div>
      <div style={{ marginTop: 'var(--space-6)' }}>
        <ReportsPage isOffline={isOffline} />
      </div>
    </div>
  );
}
