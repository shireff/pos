import React from 'react';

export interface HealthStatus {
  dbConnected: boolean;
  encryptionActive: boolean;
  appVersion: string;
}

/**
 * HealthScreen — shared component displayed on both Desktop and Android app shells.
 * Shows local DB connection status, encryption status, and app version.
 * This component is part of packages/ui-components and contains no platform-specific code.
 */
export function HealthScreen({ dbConnected, encryptionActive, appVersion }: HealthStatus) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f1117',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        gap: '1rem',
      }}
    >
      <h1 style={{ fontSize: '1.75rem', color: '#60a5fa' }}>Smart Retail OS</h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          padding: '1.5rem',
          backgroundColor: '#1e2433',
          borderRadius: '12px',
          minWidth: '320px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <StatusRow
          label="Local DB"
          value={dbConnected ? 'Connected' : 'Disconnected'}
          ok={dbConnected}
        />
        <StatusRow
          label="Encryption"
          value={encryptionActive ? 'Active' : 'Inactive'}
          ok={encryptionActive}
        />
        <StatusRow label="App Version" value={appVersion} ok={true} />
      </div>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0',
        borderBottom: '1px solid #2d3748',
      }}
    >
      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{label}</span>
      <span
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: ok ? '#34d399' : '#f87171',
        }}
      >
        {value}
      </span>
    </div>
  );
}
