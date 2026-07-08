import React from 'react';

export interface BarcodeDisplayProps {
  value: string;
}

export function BarcodeDisplay({ value }: BarcodeDisplayProps) {
  return (
    <div
      style={{ border: '1px dashed #d0d7de', borderRadius: 12, padding: 16, textAlign: 'center' }}
    >
      <svg viewBox="0 0 220 72" style={{ width: '100%', maxWidth: 220, height: 72 }}>
        <rect x="0" y="0" width="220" height="72" fill="#fff" />
        {[
          8, 18, 28, 38, 48, 58, 68, 78, 88, 98, 108, 118, 128, 138, 148, 158, 168, 178, 188, 198,
          208,
        ].map((x, index) => (
          <rect
            key={`${x}-${index}`}
            x={x}
            y="8"
            width={index % 2 === 0 ? 4 : 2}
            height="56"
            fill="#0f172a"
          />
        ))}
      </svg>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>{value}</div>
      <div style={{ marginTop: 8, color: '#57606a', fontSize: 13 }}>Barcode • Copy / Print</div>
    </div>
  );
}
