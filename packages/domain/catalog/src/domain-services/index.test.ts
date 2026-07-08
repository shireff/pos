import { describe, expect, it } from 'vitest';
import { Category, UnitOfMeasure } from '../entities';
import { Barcode } from '../value-objects';
import { CategoryTreeService, UnitConversionService } from './index';

describe('CategoryTreeService', () => {
  it('rejects circular parent assignments', () => {
    const root = Category.create({ companyId: 'company-1', name: { ar: 'Root' }, parentId: null });
    const child = Category.create({
      companyId: 'company-1',
      name: { ar: 'Child' },
      parentId: root.id,
    });
    const grandChild = Category.create({
      companyId: 'company-1',
      name: { ar: 'Grandchild' },
      parentId: child.id,
    });

    expect(() =>
      CategoryTreeService.ensureNoCircularReference(grandChild.id, child.id, [
        root,
        child,
        grandChild,
      ]),
    ).toThrow('Circular parent reference is not allowed');
  });

  it('archives an entire subtree recursively', () => {
    const root = Category.create({ companyId: 'company-1', name: { ar: 'Root' }, parentId: null });
    const child = Category.create({
      companyId: 'company-1',
      name: { ar: 'Child' },
      parentId: root.id,
    });
    const grandChild = Category.create({
      companyId: 'company-1',
      name: { ar: 'Grandchild' },
      parentId: child.id,
    });

    CategoryTreeService.archiveSubtree([root, child, grandChild], root.id);

    expect(root.isDeleted).toBe(true);
    expect(child.isDeleted).toBe(true);
    expect(grandChild.isDeleted).toBe(true);
  });
});

describe('UnitOfMeasure', () => {
  it('requires base units to have a factor of 1', () => {
    expect(() =>
      UnitOfMeasure.create({
        productId: 'product-1',
        unitName: 'Carton',
        conversionFactorToBase: 2,
        isBaseUnit: true,
      }),
    ).toThrow('Base units must use a conversion factor of 1');
  });

  it('accepts a valid non-base unit', () => {
    const unit = UnitOfMeasure.create({
      productId: 'product-1',
      unitName: 'Box',
      conversionFactorToBase: 12,
      isBaseUnit: false,
    });

    expect(unit.conversionFactorToBase).toBe(12);
  });
});

describe('UnitConversionService', () => {
  it('converts quantities using exact integer arithmetic', () => {
    expect(UnitConversionService.convertQuantity(3, 12, 1)).toBe(36);
    expect(UnitConversionService.convertQuantity(30, 1, 1000)).toBe(0);
  });
});

describe('bundle deductions', () => {
  it('rounds bundle deductions down and preserves proportional ratios', () => {
    const deductions = UnitConversionService.calculateComponentDeductions(10, [
      { deductionRatio: 0.5, quantity: 1 },
      { deductionRatio: 0.25, quantity: 1 },
      { deductionRatio: 0.25, quantity: 1 },
    ]);

    expect(deductions).toEqual([5, 2, 2]);
  });
});

describe('Barcode', () => {
  it('rejects invalid Code128 characters', () => {
    expect(() => Barcode.code128('ABC\u0001DEF')).toThrow(
      'CODE128 barcode contains invalid characters',
    );
  });

  it('rejects invalid EAN-13 checksums', () => {
    expect(() => Barcode.ean13('1234567890123')).toThrow('EAN-13 checksum failed');
  });
});
