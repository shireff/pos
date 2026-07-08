import { describe, expect, it } from 'vitest';
import {
  CreateProductSchema,
  UpdateProductSchema,
  AddVariantSchema,
  ConfigureBundleSchema,
  GenerateBarcodeSchema,
} from './index';

describe('catalog Zod schemas', () => {
  it('validates a create product payload', () => {
    const parsed = CreateProductSchema.safeParse({
      name: { ar: 'بن', en: 'Coffee' },
      sku: 'SKU-001',
      categoryId: '018f5c7f-9c0d-7a2b-8f0d-1234567890ab',
      unitId: '018f5c7f-9c0d-7a2b-8f0d-1234567890ac',
      costPrice: 1200,
      sellingPrice: 1500,
      status: 'active',
    });

    expect(parsed.success).toBe(true);
  });

  it('requires at least one field for update payloads', () => {
    const parsed = UpdateProductSchema.safeParse({});

    expect(parsed.success).toBe(false);
  });

  it('validates a variant payload', () => {
    const parsed = AddVariantSchema.safeParse({
      name: { ar: 'متغير', en: 'Variant' },
      sku: 'VAR-001',
      barcode: '1234567890128',
      additionalPrice: 250,
      attributes: { color: 'red' },
    });

    expect(parsed.success).toBe(true);
  });

  it('validates bundle configuration payloads', () => {
    const parsed = ConfigureBundleSchema.safeParse({
      components: [
        {
          componentProductId: '018f5c7f-9c0d-7a2b-8f0d-1234567890ad',
          quantity: 2,
          deductionRatio: 0.5,
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it('validates barcode generation payloads', () => {
    const parsed = GenerateBarcodeSchema.safeParse({
      variantId: '018f5c7f-9c0d-7a2b-8f0d-1234567890ae',
      barcodeType: 'EAN-13',
    });

    expect(parsed.success).toBe(true);
  });
});
