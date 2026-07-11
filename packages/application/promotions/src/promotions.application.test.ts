import { describe, it, expect, vi } from 'vitest';
import { CreateDiscountRuleCommand } from './use-cases/discount/create-discount-rule.command';
import { UpdateDiscountRuleCommand } from './use-cases/discount/update-discount-rule.command';
import { DeactivateDiscountRuleCommand } from './use-cases/discount/deactivate-discount-rule.command';
import { Discount } from '@packages/domain-promotions';
import type { DiscountRepository } from '../ports';

function makeRepo(): DiscountRepository {
  const store = new Map<string, Discount>();
  return {
    findById: vi.fn((id: string, companyId: string) => Promise.resolve(store.get(`${companyId}:${id}`) ?? null)),
    findByCompany: vi.fn(() => Promise.resolve(Array.from(store.values()))),
    save: vi.fn(async (discount: Discount) => {
      store.set(`${discount.companyId}:${discount.id}`, discount);
    }),
  } as unknown as DiscountRepository;
}

describe('CreateDiscountRuleCommand', () => {
  it('creates and persists a discount rule', async () => {
    const repo = makeRepo();
    const cmd = new CreateDiscountRuleCommand(repo);
    const discount = await cmd.execute({
      companyId: 'c1',
      name: '10% off',
      type: 'item',
      ruleJson: { type: 'item', discountType: 'percentage', amount: 10, tiers: [] },
      validFrom: '2025-01-01',
      priority: 1,
      isExclusive: true,
    });
    expect(discount.id).toBeTruthy();
    expect(discount.name).toBe('10% off');
    expect(discount.priority).toBe(1);
    expect(repo.save).toHaveBeenCalledWith(discount);
  });
});

describe('UpdateDiscountRuleCommand', () => {
  it('updates an existing rule', async () => {
    const repo = makeRepo();
    const existing = Discount.create({
      companyId: 'c1',
      name: 'Old',
      type: 'item',
      ruleJson: { type: 'item', discountType: 'percentage', amount: 10, tiers: [] },
      isActive: true,
      validFrom: null,
      validUntil: null,
      priority: 0,
      isExclusive: false,
    });
    await repo.save(existing);

    const cmd = new UpdateDiscountRuleCommand(repo);
    const updated = await cmd.execute({ id: existing.id, companyId: 'c1', name: 'New', priority: 5 });
    expect(updated.name).toBe('New');
    expect(updated.priority).toBe(5);
  });

  it('throws when rule not found', async () => {
    const repo = makeRepo();
    const cmd = new UpdateDiscountRuleCommand(repo);
    await expect(cmd.execute({ id: 'missing', companyId: 'c1', name: 'X' })).rejects.toThrow();
  });
});

describe('DeactivateDiscountRuleCommand', () => {
  it('deactivates an existing rule', async () => {
    const repo = makeRepo();
    const existing = Discount.create({
      companyId: 'c1',
      name: 'Rule',
      type: 'item',
      ruleJson: { type: 'item', discountType: 'percentage', amount: 10, tiers: [] },
      isActive: true,
      validFrom: null,
      validUntil: null,
      priority: 0,
      isExclusive: false,
    });
    await repo.save(existing);

    const cmd = new DeactivateDiscountRuleCommand(repo);
    const deactivated = await cmd.execute({ id: existing.id, companyId: 'c1' });
    expect(deactivated.isActive).toBe(false);
  });
});
