import { TaxRule } from '../entities';

/**
 * TaxRuleSet is a company-scoped collection of active tax rules.
 * It is not persisted as its own aggregate — it is composed at query time
 * from the company's tax_rules collection and used for calculation only.
 */
export class TaxRuleSet {
  private readonly rules: TaxRule[];

  public constructor(rules: TaxRule[]) {
    this.rules = rules.filter((r) => r.isActive && !r.isDeleted);
  }

  /**
   * Finds the applicable tax rule for a given product variant and category.
   * Precedence: product-scoped > category-scoped > all.
   */
  public findApplicableRule(productVariantId: string, categoryId: string | null): TaxRule | null {
    // 1. Product-scoped match
    const productRule = this.rules.find(
      (r) => r.appliesTo === 'product' && r.scopeIds.includes(productVariantId),
    );
    if (productRule) return productRule;

    // 2. Category-scoped match
    if (categoryId) {
      const categoryRule = this.rules.find(
        (r) => r.appliesTo === 'category' && r.scopeIds.includes(categoryId),
      );
      if (categoryRule) return categoryRule;
    }

    // 3. Default (applies to all)
    const defaultRule = this.rules.find((r) => r.appliesTo === 'all');
    return defaultRule ?? null;
  }

  /**
   * Calculates tax for a line item in piasters.
   * Returns 0 if no applicable rule is found (tax-exempt).
   */
  public calculateLineTax(
    subtotalPiasters: number,
    productVariantId: string,
    categoryId: string | null,
  ): number {
    const rule = this.findApplicableRule(productVariantId, categoryId);
    if (!rule) return 0;
    return rule.calculateTax(subtotalPiasters);
  }
}
