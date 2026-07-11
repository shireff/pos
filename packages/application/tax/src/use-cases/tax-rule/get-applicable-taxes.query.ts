import { TaxRule } from '@packages/domain-tax';
import { TaxRuleRepository } from '../../ports';

export interface GetApplicableTaxesInput {
  companyId: string;
  productVariantIds: string[];
  categoryIds: string[];
  subtotalPiasters: number;
  mode?: 'additive' | 'compound';
}

export interface TaxLineResult {
  productVariantId: string;
  taxAmountPiasters: number;
  ruleName: string;
}

export class GetApplicableTaxesQuery {
  constructor(private readonly taxRuleRepo: TaxRuleRepository) {}

  async execute(input: GetApplicableTaxesInput): Promise<TaxLineResult[]> {
    const rules = await this.taxRuleRepo.findByCompany(input.companyId, { isActive: true });
    const ruleSet = new (await import('@packages/domain-tax')).TaxRuleSet(rules);
    const service = new (await import('@packages/domain-tax')).TaxCalculationService(ruleSet, input.mode ?? 'additive');

    const result: TaxLineResult[] = [];
    for (let i = 0; i < input.productVariantIds.length; i++) {
      const subtotal = Math.round(input.subtotalPiasters / input.productVariantIds.length);
      const categoryId = input.categoryIds[i] ?? null;
      const applicableRule = ruleSet.findApplicableRule(input.productVariantIds[i], categoryId);
      const taxAmount = service.calculateTotal([{
        productVariantId: input.productVariantIds[i],
        categoryId,
        subtotalPiasters: subtotal,
      }]);

      result.push({
        productVariantId: input.productVariantIds[i],
        taxAmountPiasters: taxAmount,
        ruleName: applicableRule?.name ?? 'none',
      });
    }
    return result;
  }
}
