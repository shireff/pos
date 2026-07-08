import { describe, it, expect } from 'vitest';
import { ProductCard } from './ProductCard';
import { VariantBadge } from './VariantBadge';
import { UnitSelector } from './UnitSelector';
import { BarcodeDisplay } from './BarcodeDisplay';

describe('catalog components', () => {
  it('renders product card metadata', () => {
    const element = ProductCard({
      name: 'Coffee',
      sku: 'SKU-1001',
      price: 1490,
      stockLabel: '12 units',
      nameAr: 'قهوة',
      nameEn: 'Coffee',
    });

    expect(element.props.children).toBeDefined();
  });

  it('renders variant badge with attributes', () => {
    const element = VariantBadge({ label: 'Classic', attributes: ['Large'] });
    expect(element.props.children).toBeDefined();
  });

  it('renders unit selector options', () => {
    const element = UnitSelector({
      units: [
        { id: 'pcs', label: 'Pieces', conversionLabel: '1 base unit' },
        { id: 'box', label: 'Box', conversionLabel: '12 pcs' },
      ],
      selectedUnit: 'pcs',
      onSelect: () => undefined,
    });

    expect(element.props.children).toHaveLength(2);
  });

  it('renders barcode display', () => {
    const element = BarcodeDisplay({ value: 'SKU-1001' });
    expect(element.props.children).toBeDefined();
  });
});
