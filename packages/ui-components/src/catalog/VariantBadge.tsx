import React from 'react';

export interface VariantBadgeProps {
  label: string;
  selected?: boolean;
  attributes?: string[];
}

export function VariantBadge({ label, selected = false, attributes = [] }: VariantBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: selected ? '#0969da' : '#f6f8fa',
        color: selected ? '#fff' : '#24292f',
        border: selected ? '1px solid #0969da' : '1px solid #d0d7de',
      }}
    >
      {label}
      {attributes.length > 0 ? (
        <span style={{ opacity: 0.8 }}>• {attributes.join(', ')}</span>
      ) : null}
    </span>
  );
}
