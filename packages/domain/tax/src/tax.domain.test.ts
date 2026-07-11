import { describe, it, expect } from 'vitest';
import { TaxRule, PriceChange } from './entities';
import { TaxRuleSet } from './aggregates';
import { TaxCalculationService } from './domain-services';

describe('TaxRule entity', () => {
  const baseProps = {
    companyId: 'c1',
    name: 'VAT',
    rateBasisPoints: 1400,
    appliesTo: 'all' as const,
    scopeIds: [] as string[],
    priority: 0,
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('creates with generated id and timestamps', () => {
    const rule = TaxRule.create(baseProps);
    expect(rule.id).toBeTruthy();
    expect(rule.ratePercent).toBe(14);
  });

  it('reconstitutes from persisted props', () => {
    const rule = TaxRule.reconstitute({ id: 't1', ...baseProps });
    expect(rule.id).toBe('t1');
    expect(rule.ratePercent).toBe(14);
  });

  it('calculateTax computes the correct piasters', () => {
    const rule = TaxRule.create(baseProps);
    expect(rule.calculateTax(10000)).toBe(1400);
  });

  it('activate/deactivate/archive', () => {
    const rule = TaxRule.create(baseProps);
    rule.deactivate();
    expect(rule.isActive).toBe(false);
    rule.activate();
    expect(rule.isActive).toBe(true);
    rule.archive();
    expect(rule.isDeleted).toBe(true);
  });

  it('update mutates mutable fields', () => {
    const rule = TaxRule.create(baseProps);
    rule.update({ name: 'New VAT', rateBasisPoints: 1000, priority: 10 });
    expect(rule.name).toBe('New VAT');
    expect(rule.ratePercent).toBe(10);
    expect(rule.priority).toBe(10);
  });

  it('throws on invalid rate bounds', () => {
    expect(() => TaxRule.create({ ...baseProps, rateBasisPoints: -1 })).toThrow();
    expect(() => TaxRule.create({ ...baseProps, rateBasisPoints: 10001 })).toThrow();
  });
});

describe('TaxRuleSet aggregate', () => {
  function makeRule(name: string, appliesTo: 'all' | 'category' | 'product', scopeIds: string[], priority = 0): TaxRule {
    return TaxRule.create({
      companyId: 'c1',
      name,
      rateBasisPoints: 1000,
      appliesTo,
      scopeIds,
      priority,
      isActive: true,
    });
  }

  it('findApplicableRule returns product rule first (BR-TAX-004)', () => {
    const set = new TaxRuleSet([
      makeRule('default', 'all', [], 10),
      makeRule('cat', 'category', ['cat1'], 5),
      makeRule('prod', 'product', ['v1'], 1),
    ]);
    expect(set.findApplicableRule('v1', 'cat1')?.name).toBe('prod');
  });

  it('falls back to category rule when no product rule', () => {
    const set = new TaxRuleSet([
      makeRule('default', 'all', [], 10),
      makeRule('cat', 'category', ['cat1'], 5),
    ]);
    expect(set.findApplicableRule('v1', 'cat1')?.name).toBe('cat');
  });

  it('falls back to default all rule', () => {
    const set = new TaxRuleSet([makeRule('default', 'all', [], 10)]);
    expect(set.findApplicableRule('v1', 'cat1')?.name).toBe('default');
  });

  it('returns null when no applicable rule', () => {
    const set = new TaxRuleSet([]);
    expect(set.findApplicableRule('v1', 'cat1')).toBeNull();
  });

  it('calculateLineTax additive mode sums correctly', () => {
    const set = new TaxRuleSet([makeRule('default', 'all', [], 0)]);
    expect(set.calculateLineTax(10000, 'v1', null, 'additive')).toBe(1000);
  });

  it('calculateLineTax compound mode chains tax on tax', () => {
    const set = new TaxRuleSet([
      makeRule('vat1', 'all', [], 0),
      makeRule('vat2', 'all', [], 5),
    ]);
    expect(set.calculateLineTax(10000, 'v1', null, 'compound')).toBe(2100);
  });

  it('defaultEgyptVAT returns empty set', () => {
    const set = TaxRuleSet.defaultEgyptVAT();
    expect(set.findApplicableRule('v1', null)).toBeNull();
  });
});

describe('TaxCalculationService', () => {
  it('calculateTotal sums taxes across lines', () => {
    const rule = TaxRule.create({
      companyId: 'c1',
      name: 'VAT',
      rateBasisPoints: 1400,
      appliesTo: 'all',
      scopeIds: [],
      priority: 0,
      isActive: true,
    });
    const set = new TaxRuleSet([rule]);
    const service = new TaxCalculationService(set, 'additive');
    const total = service.calculateTotal([
      { productVariantId: 'v1', categoryId: null, subtotalPiasters: 10000 },
      { productVariantId: 'v2', categoryId: null, subtotalPiasters: 5000 },
    ]);
    expect(total).toBe(2100);
  });
});

describe('PriceChange entity', () => {
  const baseProps = {
    companyId: 'c1',
    productId: 'p1',
    variantId: null,
    oldPricePiasters: 10000,
    newPricePiasters: 15000,
    requestedByUserId: 'u1',
    approvedByUserId: null,
    status: 'pending_approval' as const,
    notes: null,
    requestedAt: new Date().toISOString(),
    approvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('creates with pending_approval status', () => {
    const pc = PriceChange.create(baseProps);
    expect(pc.id).toBeTruthy();
    expect(pc.status).toBe('pending_approval');
    expect(pc.approvedByUserId).toBeNull();
  });

  it('reconstitutes from persisted props', () => {
    const pc = PriceChange.reconstitute({ id: 'pc1', ...baseProps });
    expect(pc.id).toBe('pc1');
    expect(pc.status).toBe('pending_approval');
  });

  it('approve transitions to approved', () => {
    const pc = PriceChange.create(baseProps);
    pc.approve('u2');
    expect(pc.status).toBe('approved');
    expect(pc.approvedByUserId).toBe('u2');
    expect(pc.approvedAt).toBeTruthy();
  });

  it('reject transitions to rejected', () => {
    const pc = PriceChange.create(baseProps);
    pc.reject();
    expect(pc.status).toBe('rejected');
    expect(pc.approvedByUserId).toBeNull();
    expect(pc.approvedAt).toBeTruthy();
  });

  it('blocks approve/reject unless pending', () => {
    const pc = PriceChange.create(baseProps);
    pc.approve('u2');
    expect(() => pc.approve('u3')).toThrow();
    expect(() => pc.reject()).toThrow();
  });

  it('enforces new price positivity', () => {
    expect(() => PriceChange.create({ ...baseProps, newPricePiasters: 0 })).toThrow();
    expect(() => PriceChange.create({ ...baseProps, oldPricePiasters: -1 })).toThrow();
  });
});
