import React from 'react';
import { ReportsPage } from './ReportsPage';

export function BranchManagerDashboard({ isOffline = false }: { isOffline?: boolean }): React.ReactElement {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Branch Manager Dashboard</h1>
          <p className="page-subtitle">Daily summary, inventory alerts, shift performance, staff metrics.</p>
        </div>
      </div>
      {isOffline && (
        <div className="offline-banner" style={{ padding: 'var(--space-2)', background: 'var(--color-warning)', color: 'var(--color-text-inverse)', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
          Offline — data limited to local branch
        </div>
      )}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Daily Summary</h3>
          <p>Daily sales summary available in Reports.</p>
        </div>
        <div className="dashboard-card">
          <h3>Inventory Alerts</h3>
          <p>Alerts for items below reorder point.</p>
        </div>
        <div className="dashboard-card">
          <h3>Shift Performance</h3>
          <p>Shift performance metrics available in Reports.</p>
        </div>
        <div className="dashboard-card">
          <h3>Staff Metrics</h3>
          <p>Employee performance available in Reports.</p>
        </div>
      </div>
      <div style={{ marginTop: 'var(--space-6)' }}>
        <ReportsPage isOffline={isOffline} />
      </div>
    </div>
  );
}
