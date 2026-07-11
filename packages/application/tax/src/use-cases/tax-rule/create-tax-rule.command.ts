import { TaxRule } from '@packages/domain-tax';
import { TaxRuleRepository } from '../../ports';

export interface CreateTaxRuleInput {
  companyId: string;
  name: string;
  rateBasisPoints: number;
  appliesTo: 'all' | 'category' | 'product';
  scopeIds: string[];
  priority?: number;
}

export class CreateTaxRuleCommand {
  constructor(private readonly taxRuleRepo: TaxRuleRepository) {}

  async execute(input: CreateTaxRuleInput): Promise<TaxRule> {
    const taxRule = TaxRule.create({
      companyId: input.companyId,
      name: input.name,
      rateBasisPoints: input.rateBasisPoints,
      appliesTo: input.appliesTo,
      scopeIds: input.scopeIds,
      priority: input.priority ?? 0,
      isActive: true,
    });

    await this.taxRuleRepo.save(taxRule);
    return taxRule;
  }
}
