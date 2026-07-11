import { describe, it, expect, vi } from 'vitest';
import { CreateTaxRuleCommand } from './use-cases/tax-rule/create-tax-rule.command';
import { RequestPriceChangeCommand } from './use-cases/price-change/request-price-change.command';
import { ApprovePriceChangeCommand } from './use-cases/price-change/approve-price-change.command';
import { RejectPriceChangeCommand } from './use-cases/price-change/reject-price-change.command';
import { TaxRule } from '@packages/domain-tax';
import { PriceChange } from '@packages/domain-tax';
import type { TaxRuleRepository } from '../ports';
import type { PriceChangeRepository } from '../ports';

function makeTaxRepo(): TaxRuleRepository {
  const store = new Map<string, TaxRule>();
  return {
    findById: vi.fn((id: string, companyId: string) => Promise.resolve(store.get(`${companyId}:${id}`) ?? null)),
    findByCompany: vi.fn(() => Promise.resolve(Array.from(store.values()))),
    save: vi.fn(async (rule: TaxRule) => { store.set(`${rule.companyId}:${rule.id}`, rule); }),
  } as unknown as TaxRuleRepository;
}

function makePriceRepo(): PriceChangeRepository {
  const store = new Map<string, PriceChange>();
  return {
    findById: vi.fn((id: string, companyId: string) => Promise.resolve(store.get(`${companyId}:${id}`) ?? null)),
    findByProduct: vi.fn(() => Promise.resolve([])),
    findByCompanyPendingApproval: vi.fn(() => Promise.resolve([])),
    save: vi.fn(async (pc: PriceChange) => { store.set(`${pc.companyId}:${pc.id}`, pc); }),
  } as unknown as PriceChangeRepository;
}

describe('CreateTaxRuleCommand', () => {
  it('creates and persists a tax rule', async () => {
    const repo = makeTaxRepo();
    const cmd = new CreateTaxRuleCommand(repo);
    const rule = await cmd.execute({
      companyId: 'c1',
      name: 'VAT 14%',
      rateBasisPoints: 1400,
      appliesTo: 'all',
      scopeIds: [],
      priority: 0,
    });
    expect(rule.id).toBeTruthy();
    expect(rule.ratePercent).toBe(14);
    expect(repo.save).toHaveBeenCalledWith(rule);
  });
});

describe('RequestPriceChangeCommand', () => {
  it('auto-approves when change is below threshold', async () => {
    const repo = makePriceRepo();
    const cmd = new RequestPriceChangeCommand(repo);
    const pc = await cmd.execute({
      companyId: 'c1',
      productId: 'p1',
      oldPricePiasters: 10000,
      newPricePiasters: 11000,
      requestedByUserId: 'u1',
      autoApproveThresholdPiasters: 2000,
    });
    expect(pc.status).toBe('approved');
  });

  it('keeps pending when change exceeds threshold', async () => {
    const repo = makePriceRepo();
    const cmd = new RequestPriceChangeCommand(repo);
    const pc = await cmd.execute({
      companyId: 'c1',
      productId: 'p1',
      oldPricePiasters: 10000,
      newPricePiasters: 15000,
      requestedByUserId: 'u1',
      autoApproveThresholdPiasters: 2000,
    });
    expect(pc.status).toBe('pending_approval');
  });
});

describe('ApprovePriceChangeCommand', () => {
  it('approves a pending price change', async () => {
    const repo = makePriceRepo();
    const pending = PriceChange.create({
      companyId: 'c1',
      productId: 'p1',
      oldPricePiasters: 10000,
      newPricePiasters: 15000,
      requestedByUserId: 'u1',
    });
    await repo.save(pending);

    const cmd = new ApprovePriceChangeCommand(repo);
    const approved = await cmd.execute({ id: pending.id, companyId: 'c1', approvedByUserId: 'u2' });
    expect(approved.status).toBe('approved');
    expect(approved.approvedByUserId).toBe('u2');
  });

  it('throws when price change is not pending', async () => {
    const repo = makePriceRepo();
    const approved = PriceChange.create({
      companyId: 'c1',
      productId: 'p1',
      oldPricePiasters: 10000,
      newPricePiasters: 15000,
      requestedByUserId: 'u1',
    });
    approved.approve('u1');
    await repo.save(approved);

    const cmd = new ApprovePriceChangeCommand(repo);
    await expect(cmd.execute({ id: approved.id, companyId: 'c1', approvedByUserId: 'u2' })).rejects.toThrow();
  });
});

describe('RejectPriceChangeCommand', () => {
  it('rejects a pending price change', async () => {
    const repo = makePriceRepo();
    const pending = PriceChange.create({
      companyId: 'c1',
      productId: 'p1',
      oldPricePiasters: 10000,
      newPricePiasters: 15000,
      requestedByUserId: 'u1',
    });
    await repo.save(pending);

    const cmd = new RejectPriceChangeCommand(repo);
    const rejected = await cmd.execute({ id: pending.id, companyId: 'c1' });
    expect(rejected.status).toBe('rejected');
  });
});
