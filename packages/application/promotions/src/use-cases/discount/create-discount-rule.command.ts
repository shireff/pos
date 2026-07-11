import { Discount, DiscountRuleJson, DiscountType } from '@packages/domain-promotions';
import { DiscountRepository } from '../../ports';

export interface CreateDiscountRuleInput {
  companyId: string;
  name: string;
  type: DiscountType;
  ruleJson: DiscountRuleJson;
  validFrom?: string;
  validUntil?: string;
  priority?: number;
  isExclusive?: boolean;
}

export class CreateDiscountRuleCommand {
  constructor(private readonly discountRepo: DiscountRepository) {}

  async execute(input: CreateDiscountRuleInput): Promise<Discount> {
    const ruleJson: DiscountRuleJson = {
      ...input.ruleJson,
      tiers: input.ruleJson.tiers || [],
    };

    const discount = Discount.create({
      companyId: input.companyId,
      name: input.name,
      type: input.type,
      ruleJson,
      isActive: true,
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
      priority: input.priority ?? 0,
      isExclusive: input.isExclusive ?? false,
    });

    await this.discountRepo.save(discount);
    return discount;
  }
}
