import { Identifier } from '@packages/shared-kernel';
import { Customer } from '@packages/domain-crm';
import { CustomerMergeService } from '@packages/domain-crm';
import { CustomerRepository } from '../ports';

export interface MergeCustomersInput {
  companyId: string;
  sourceId: string;
  targetId: string;
  performedByUserId: string;
}

export class MergeCustomersCommand {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: MergeCustomersInput): Promise<{ target: Customer; result: unknown }> {
    CustomerMergeService.validate(input.sourceId, input.targetId);

    const source = await this.customerRepo.findById(input.sourceId, input.companyId);
    if (!source) {
      throw new Error(`Source customer ${input.sourceId} not found`);
    }

    const target = await this.customerRepo.findById(input.targetId, input.companyId);
    if (!target) {
      throw new Error(`Target customer ${input.targetId} not found`);
    }

    source.deactivate();
    await this.customerRepo.save(source);
    await this.customerRepo.save(target);

    const result = CustomerMergeService.buildResult(input.targetId, input.sourceId, 0, 0, 0);

    return { target, result };
  }
}
