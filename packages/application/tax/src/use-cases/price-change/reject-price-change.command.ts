import { PriceChange } from '@packages/domain-tax';
import { PriceChangeRepository } from '../../ports';

export interface RejectPriceChangeInput {
  id: string;
  companyId: string;
}

export class RejectPriceChangeCommand {
  constructor(private readonly priceChangeRepo: PriceChangeRepository) {}

  async execute(input: RejectPriceChangeInput): Promise<PriceChange> {
    const existing = await this.priceChangeRepo.findById(input.id, input.companyId);
    if (!existing) throw new Error(`Price change with id "${input.id}" not found`);
    if (existing.status !== 'pending_approval') throw new Error('Price change is not pending approval');

    existing.reject();
    await this.priceChangeRepo.save(existing);
    return existing;
  }
}
