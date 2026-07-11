import { PriceChange, PriceChangeStatus } from '@packages/domain-tax';
import { PriceChangeRepository } from '../../ports';

export interface ApprovePriceChangeInput {
  id: string;
  companyId: string;
  approvedByUserId: string;
}

export class ApprovePriceChangeCommand {
  constructor(private readonly priceChangeRepo: PriceChangeRepository) {}

  async execute(input: ApprovePriceChangeInput): Promise<PriceChange> {
    const existing = await this.priceChangeRepo.findById(input.id, input.companyId);
    if (!existing) throw new Error(`Price change with id "${input.id}" not found`);
    if (existing.status !== 'pending_approval') throw new Error('Price change is not pending approval');

    existing.approve(input.approvedByUserId);
    await this.priceChangeRepo.save(existing);
    return existing;
  }
}
