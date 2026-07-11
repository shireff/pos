import { Discount } from '@packages/domain-promotions';
import { DiscountRepository } from '../../ports';
import { CartContext, DiscountEngine } from '@packages/domain-promotions';

export interface EvaluateCartDiscountsInput {
  companyId: string;
  discountRuleIds: string[];
  cartSubtotalPiasters: number;
  cart: CartContext;
}

export interface LineDiscountResult {
  lineIndex: number;
  discounts: Array<{
    ruleId: string;
    name: string;
    discountAmountPiasters: number;
    exclusive: boolean;
  }>;
}

export interface CartDiscountBreakdown {
  lineDiscounts: LineDiscountResult[];
  cartDiscounts: Array<{
    ruleId: string;
    name: string;
    discountAmountPiasters: number;
    exclusive: boolean;
  }>;
  totalDiscountPiasters: number;
}

export class EvaluateCartDiscountsQuery {
  constructor(private readonly discountRepo: DiscountRepository) {}

  async execute(input: EvaluateCartDiscountsInput): Promise<CartDiscountBreakdown> {
    const rules = await this.discountRepo.findByCompany(
      input.companyId,
      undefined,
      true,
    );

    const applicableRules = DiscountEngine.filterApplicable(rules);

    const lineDiscounts = DiscountEngine.evaluateLineItemDiscounts(applicableRules, input.cart);
    const cartDiscounts = DiscountEngine.evaluateCartDiscounts(applicableRules, input.cartSubtotalPiasters, input.cart);

    let totalDiscountPiasters = 0;

    const lineResults: LineDiscountResult[] = [];
    for (const [lineIndex, discounts] of lineDiscounts.entries()) {
      const lineTotal = discounts.reduce((s, d) => s + d.discountAmountPiasters, 0);
      totalDiscountPiasters += lineTotal;
      lineResults.push({ lineIndex, discounts });
    }

    for (const cd of cartDiscounts) {
      totalDiscountPiasters += cd.discountAmountPiasters;
    }

    return {
      lineDiscounts: lineResults,
      cartDiscounts,
      totalDiscountPiasters: Math.min(totalDiscountPiasters, input.cartSubtotalPiasters),
    };
  }
}
