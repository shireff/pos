import React from 'react';

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isPlatformAdmin?: boolean;
}

export function AuthShell({ title, subtitle, children, isPlatformAdmin = false }: AuthShellProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: isPlatformAdmin
          ? 'linear-gradient(135deg, #0f172a, #1e293b)'
          : 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
        color: isPlatformAdmin ? '#f8fafc' : '#0f172a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.16)',
          background: isPlatformAdmin ? '#111827' : '#ffffff',
          border: isPlatformAdmin ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
        }}
      >
        {isPlatformAdmin ? (
          <div
            style={{
              marginBottom: '16px',
              fontSize: '0.8rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#f59e0b',
            }}
          >
            Internal Tool
          </div>
        ) : null}
        <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>{title}</h1>
        {subtitle ? (
          <p style={{ margin: 0, color: isPlatformAdmin ? '#cbd5e1' : '#64748b', lineHeight: 1.6 }}>
            {subtitle}
          </p>
        ) : null}
        <div style={{ marginTop: '24px' }}>{children}</div>
      </div>
    </div>
  );
}
