import { Discount } from '@packages/domain-promotions';
import { DiscountRepository } from '../../ports';

export interface DeactivateDiscountRuleInput {
  id: string;
  companyId: string;
}

export class DeactivateDiscountRuleCommand {
  constructor(private readonly discountRepo: DiscountRepository) {}

  async execute(input: DeactivateDiscountRuleInput): Promise<Discount> {
    const existing = await this.discountRepo.findById(input.id, input.companyId);
    if (!existing) throw new Error(`Discount rule with id "${input.id}" not found`);

    existing.deactivate();
    await this.discountRepo.save(existing);
    return existing;
  }
}
