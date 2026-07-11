import { Supplier } from '@packages/domain-purchasing';
import { SupplierRepository } from '../../ports';

export interface DeactivateSupplierInput {
  supplierId: string;
  companyId: string;
}

export class DeactivateSupplierCommand {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(input: DeactivateSupplierInput): Promise<Supplier> {
    const supplier = await this.repo.findById(input.supplierId, input.companyId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    supplier.deactivate();
    await this.repo.save(supplier);
    return supplier;
  }
}
