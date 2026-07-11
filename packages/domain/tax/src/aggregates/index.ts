import { TaxRule } from '../entities';

/**
 * TaxRuleSet is a company-scoped collection of active tax rules.
 * It is not persisted as its own aggregate — it is composed at query time
 * from the company's tax_rules collection and used for calculation only.
 */
export class TaxRuleSet {
  private readonly rules: TaxRule[];

  public constructor(rules: TaxRule[]) {
    const sorted = [...rules]
      .filter((r) => r.isActive && !r.isDeleted)
      .sort((a, b) => a.priority - b.priority);
    this.rules = sorted;
  }

  /**
   * Finds the applicable tax rule for a given product variant and category.
   * Precedence: product-scoped > category-scoped > all (BR-TAX-004).
   */
  public findApplicableRule(productVariantId: string, categoryId: string | null): TaxRule | null {
    const productRule = this.rules.find(
      (r) => r.appliesTo === 'product' && r.scopeIds.includes(productVariantId),
    );
    if (productRule) return productRule;

    if (categoryId) {
      const categoryRule = this.rules.find(
        (r) => r.appliesTo === 'category' && r.scopeIds.includes(categoryId),
      );
      if (categoryRule) return categoryRule;
    }

    const defaultRule = this.rules.find((r) => r.appliesTo === 'all');
    return defaultRule ?? null;
  }

  /**
   * Calculates tax for a line item in piasters.
   * Supports additive (multiple rules sum) and compound (each rule applies to base + prior tax) modes.
   * Returns 0 if no applicable rule is found (tax-exempt).
   */
  public calculateLineTax(
    subtotalPiasters: number,
    productVariantId: string,
    categoryId: string | null,
    mode: 'additive' | 'compound' = 'additive',
  ): number {
    if (mode === 'compound') {
      return this.calculateCompoundTax(subtotalPiasters, productVariantId, categoryId);
    }

    const rule = this.findApplicableRule(productVariantId, categoryId);
    if (!rule) return 0;
    return rule.calculateTax(subtotalPiasters);
  }

  private calculateCompoundTax(
    subtotalPiasters: number,
    productVariantId: string,
    categoryId: string | null,
  ): number {
    const applicableRules = this.rules.filter((r) => {
      if (r.appliesTo === 'product') return r.scopeIds.includes(productVariantId);
      if (r.appliesTo === 'category' && categoryId) return r.scopeIds.includes(categoryId);
      if (r.appliesTo === 'all') return true;
      return false;
    });

    let runningTotal = subtotalPiasters;
    for (const rule of applicableRules) {
      runningTotal += rule.calculateTax(runningTotal);
    }
    return runningTotal - subtotalPiasters;
  }

  /**
   * Creates a default Egypt VAT 14% rule set.
   */
  public static defaultEgyptVAT(rules?: TaxRule[]): TaxRuleSet {
    return new TaxRuleSet(rules ?? []);
  }
}
