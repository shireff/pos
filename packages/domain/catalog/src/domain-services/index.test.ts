import { describe, expect, it } from 'vitest';
import { Category, UnitOfMeasure } from '../entities';
import { CategoryTreeService } from './index';

describe('CategoryTreeService', () => {
  it('rejects circular parent assignments', () => {
    const root = Category.create({ companyId: 'company-1', name: 'Root', parentId: null });
    const child = Category.create({ companyId: 'company-1', name: 'Child', parentId: root.id });
    const grandChild = Category.create({
      companyId: 'company-1',
      name: 'Grandchild',
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
    const root = Category.create({ companyId: 'company-1', name: 'Root', parentId: null });
    const child = Category.create({ companyId: 'company-1', name: 'Child', parentId: root.id });
    const grandChild = Category.create({
      companyId: 'company-1',
      name: 'Grandchild',
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
