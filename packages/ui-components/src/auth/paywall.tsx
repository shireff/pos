import React from 'react';

export interface PaywallProps {
  mode: 'trial_expired' | 'suspended';
  onChoosePlan?: () => void;
}

export function Paywall({ mode, onChoosePlan }: PaywallProps) {
  const isSuspended = mode === 'suspended';

  return (
    <div
      style={{
        display: 'grid',
        gap: '16px',
        padding: '24px',
        borderRadius: '20px',
        background: '#fff7ed',
        color: '#7c2d12',
      }}
    >
      <h2 style={{ margin: 0, fontSize: '1.35rem' }}>
        {isSuspended ? 'Your account has been suspended' : 'Your 14-day trial has ended'}
      </h2>
      <p style={{ margin: 0, lineHeight: 1.6 }}>
        {isSuspended
          ? 'Access is currently restricted. Contact support to restore your account.'
          : 'Choose a plan to continue using Smart Retail OS.'}
      </p>
      {!isSuspended ? (
        <div
          style={{
            display: 'grid',
            gap: '8px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: '#ffffff',
          }}
        >
          <div style={{ fontWeight: 700 }}>Plan comparison</div>
          <div>Basic • core POS and inventory</div>
          <div>Pro • advanced reporting and sync</div>
          <div>Enterprise • multi-branch and AI insights</div>
        </div>
      ) : null}
      {!isSuspended ? (
        <button
          style={{
            border: 'none',
            borderRadius: '999px',
            padding: '10px 16px',
            background: '#0f172a',
            color: '#ffffff',
            cursor: 'pointer',
          }}
          onClick={onChoosePlan}
        >
          Choose a Plan
        </button>
      ) : (
        <a
          style={{ color: '#0f172a', fontWeight: 700 }}
          href="mailto:support@smartretailos.example"
        >
          Contact support
        </a>
      )}
    </div>
  );
}
