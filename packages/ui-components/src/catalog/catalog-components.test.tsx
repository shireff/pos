import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LocaleProvider } from '../i18n';
import { ProductCard } from './ProductCard';
import { VariantBadge } from './VariantBadge';
import { UnitSelector } from './UnitSelector';
import { BarcodeDisplay } from './BarcodeDisplay';

describe('catalog components', () => {
  it('renders product card metadata', () => {
    const html = renderToString(
      React.createElement(LocaleProvider, { locale: 'ar' },
        React.createElement(ProductCard, {
          name: 'Coffee',
          sku: 'SKU-1001',
          price: 1490,
          stockLabel: '12 units',
          nameAr: 'قهوة',
          nameEn: 'Coffee',
        })
      )
    );
    expect(html).toContain('قهوة');
    expect(html).toContain('SKU-1001');
  });

  it('renders variant badge with attributes', () => {
    const html = renderToString(
      React.createElement(LocaleProvider, { locale: 'ar' },
        React.createElement(VariantBadge, { label: 'Classic', attributes: ['Large'] })
      )
    );
    expect(html).toContain('Classic');
    expect(html).toContain('Large');
  });

  it('renders unit selector options', () => {
    const html = renderToString(
      React.createElement(LocaleProvider, { locale: 'ar' },
        React.createElement(UnitSelector, {
          units: [
            { id: 'pcs', label: 'Pieces', conversionLabel: '1 base unit' },
            { id: 'box', label: 'Box', conversionLabel: '12 pcs' },
          ],
          selectedUnit: 'pcs',
          onSelect: () => undefined,
        })
      )
    );
    expect(html).toContain('Pieces');
    expect(html).toContain('Box');
  });

  it('renders barcode display', () => {
    const html = renderToString(
      React.createElement(LocaleProvider, { locale: 'ar' },
        React.createElement(BarcodeDisplay, { value: 'SKU-1001' })
      )
    );
    expect(html).toContain('SKU-1001');
  });
});
