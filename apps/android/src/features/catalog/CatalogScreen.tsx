import React, { useState } from 'react';
import { ProductCard, VariantBadge, UnitSelector, BarcodeDisplay } from '@packages/ui-components';

const products = [
  {
    id: '1',
    name: 'Coffee Beans',
    sku: 'SKU-1001',
    price: 1490,
    stockLabel: '12 units',
    status: 'active',
  },
  {
    id: '2',
    name: 'Water Bottle',
    sku: 'SKU-1002',
    price: 890,
    stockLabel: 'Low stock',
    status: 'draft',
  },
];

export function CatalogScreen() {
  const [selectedUnit, setSelectedUnit] = useState('pcs');

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Catalog</div>
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
      <div
        style={{
          border: '1px solid #d0d7de',
          borderRadius: 12,
          padding: 16,
          background: '#fff',
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 700 }}>Selected Product</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <VariantBadge label="Classic" selected />
          <VariantBadge label="Premium" />
        </div>
        <UnitSelector
          units={[
            { id: 'pcs', label: 'Pieces', conversionLabel: '1 base unit' },
            { id: 'box', label: 'Box', conversionLabel: '12 pcs' },
            { id: 'pack', label: 'Pack', conversionLabel: '24 pcs' },
          ]}
          selectedUnit={selectedUnit}
          onSelect={setSelectedUnit}
        />
        <BarcodeDisplay value="SKU-1001" />
      </div>
    </div>
  );
}
