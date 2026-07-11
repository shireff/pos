import React from 'react';
import { ReportsPage } from './ReportsPage';

export function OwnerDashboard({ isOffline = false }: { isOffline?: boolean }): React.ReactElement {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Owner Dashboard</h1>
          <p className="page-subtitle">P&L, revenue trends, branch comparison, top products, gross margin.</p>
        </div>
      </div>
      {isOffline && (
        <div className="offline-banner" style={{ padding: 'var(--space-2)', background: 'var(--color-warning)', color: 'var(--color-text-inverse)', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
          Offline — data limited to local branch
        </div>
      )}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>P&L Overview</h3>
          <p>Use the Reports section to view detailed P&L.</p>
        </div>
        <div className="dashboard-card">
          <h3>Revenue Trend (30 days)</h3>
          <p>Sparkline placeholder — full charts in Phase 15.</p>
        </div>
        <div className="dashboard-card">
          <h3>Branch Comparison</h3>
          <p>KPI matrix per branch available in Reports.</p>
        </div>
        <div className="dashboard-card">
          <h3>Top Products</h3>
          <p>Top products widget placeholder.</p>
        </div>
        <div className="dashboard-card">
          <h3>Gross Margin Gauge</h3>
          <p>Gauge placeholder — full visualization in Phase 15.</p>
        </div>
      </div>
      <div style={{ marginTop: 'var(--space-6)' }}>
        <ReportsPage isOffline={isOffline} />
      </div>
    </div>
  );
}
