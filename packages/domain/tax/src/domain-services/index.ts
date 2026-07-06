import { TaxRuleSet } from '../aggregates';

/**
 * TaxCalculationService provides order-level tax computation.
 * Tax amounts are computed and stored at time of sale — a later rate change
 * never retroactively alters a historical order's recorded tax (BR-TAX-005).
 */
export class TaxCalculationService {
  private readonly ruleSet: TaxRuleSet;

  public constructor(ruleSet: TaxRuleSet) {
    this.ruleSet = ruleSet;
  }

  /**
   * Calculates the tax amount for each line and returns the per-line tax map.
   */
  public calculateOrderTax(
    lines: Array<{
      productVariantId: string;
      categoryId: string | null;
      subtotalPiasters: number;
    }>,
  ): Map<string, number> {
    const result = new Map<string, number>();
    for (const line of lines) {
      const tax = this.ruleSet.calculateLineTax(
        line.subtotalPiasters,
        line.productVariantId,
        line.categoryId,
      );
      result.set(line.productVariantId, tax);
    }
    return result;
  }

  /**
   * Calculates total tax for all lines.
   */
  public calculateTotal(
    lines: Array<{
      productVariantId: string;
      categoryId: string | null;
      subtotalPiasters: number;
    }>,
  ): number {
    let total = 0;
    for (const line of lines) {
      total += this.ruleSet.calculateLineTax(
        line.subtotalPiasters,
        line.productVariantId,
        line.categoryId,
      );
    }
    return total;
  }
}
