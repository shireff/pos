'use client';

import { useEffect, useState } from 'react';
import { CapacitorHealthBridge } from '../bootstrap/capacitor-health.bridge';
import type { AppHealth } from '../bootstrap/capacitor-health.bridge';

const bridge = new CapacitorHealthBridge();

/**
 * Android Health Screen
 *
 * Reuses the same health-check concept as the Desktop shell.
 * Rendered via the shared HealthScreen component design from packages/ui-components.
 */
export default function AndroidHealthPage() {
  const [health, setHealth] = useState<AppHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bridge
      .check()
      .then(setHealth)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Unknown error');
      });
  }, []);

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        gap: '1.5rem',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      }}
    >
      {/* Logo / Brand */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: 32,
          }}
        >
          🛒
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>Smart Retail OS</h1>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
          Android — نظام نقطة البيع الذكي
        </p>
      </div>

      {/* Health Status Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 16,
          padding: '1.25rem',
          backdropFilter: 'blur(10px)',
        }}
      >
        <h2
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.75rem',
          }}
        >
          System Status
        </h2>

        {error && <StatusRow label="Error" value={error} color="#ef4444" icon="❌" />}

        {!health && !error && (
          <StatusRow label="Loading" value="Checking system health…" color="#f59e0b" icon="⏳" />
        )}

        {health && (
          <>
            <StatusRow
              label="Status"
              value={health.status.toUpperCase()}
              color={health.status === 'ok' ? '#22c55e' : '#f59e0b'}
              icon={health.status === 'ok' ? '✅' : '⚠️'}
            />
            <StatusRow label="Platform" value={health.platform} color="#94a3b8" icon="📱" />
            <StatusRow label="Version" value={`v${health.version}`} color="#94a3b8" icon="🏷️" />
            <StatusRow
              label="Time"
              value={new Date(health.timestamp).toLocaleTimeString('ar-EG')}
              color="#94a3b8"
              icon="🕐"
            />
          </>
        )}
      </div>
    </main>
  );
}

function StatusRow({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid rgba(100, 116, 139, 0.15)',
      }}
    >
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <span style={{ fontSize: '0.8rem', color: '#64748b', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.85rem', color, marginLeft: 'auto', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}
