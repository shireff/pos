import React from 'react';

export interface ProductCardProps {
  name: string;
  sku: string;
  price: number;
  stockLabel: string;
  status?: string;
  nameAr?: string;
  nameEn?: string;
}

export function ProductCard({
  name,
  sku,
  price,
  stockLabel,
  status = 'active',
  nameAr,
  nameEn,
}: ProductCardProps) {
  const primaryName = nameAr && nameEn ? `${nameAr} / ${nameEn}` : name;
  const lowStock = stockLabel.toLowerCase().includes('low');

  return (
    <div
      style={{
        border: '1px solid #d8dee4',
        borderRadius: 16,
        padding: 18,
        background: '#ffffff',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{primaryName}</div>
          <div style={{ color: '#57606a', fontSize: 13, marginTop: 6 }}>{sku}</div>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: status === 'active' ? '#1d4ed8' : '#7c3aed',
            background: status === 'active' ? '#eff6ff' : '#f3e8ff',
            borderRadius: 999,
            padding: '5px 10px',
          }}
        >
          {status}
        </span>
      </div>
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16 }}>{price.toLocaleString()} ₽</div>
        <div style={{ color: lowStock ? '#b91c1c' : '#166534', fontSize: 13 }}>{stockLabel}</div>
      </div>
    </div>
  );
}
