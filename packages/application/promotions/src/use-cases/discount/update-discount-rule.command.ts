import { Discount } from '@packages/domain-promotions';
import { DiscountRepository } from '../../ports';

export interface UpdateDiscountRuleInput {
  id: string;
  companyId: string;
  name?: string;
  ruleJson?: Partial<import('@packages/domain-promotions').DiscountRuleJson>;
  priority?: number;
  isExclusive?: boolean;
}

export class UpdateDiscountRuleCommand {
  constructor(private readonly discountRepo: DiscountRepository) {}

  async execute(input: UpdateDiscountRuleInput): Promise<Discount> {
    const existing = await this.discountRepo.findById(input.id, input.companyId);
    if (!existing) throw new Error(`Discount rule with id "${input.id}" not found`);

    const ruleJsonUpdate = input.ruleJson
      ? { ...existing.ruleJson, ...input.ruleJson, tiers: input.ruleJson.tiers ?? existing.ruleJson.tiers }
      : undefined;

    existing.update({
      name: input.name,
      ruleJson: ruleJsonUpdate,
      priority: input.priority,
      isExclusive: input.isExclusive,
    });

    await this.discountRepo.save(existing);
    return existing;
  }
}
