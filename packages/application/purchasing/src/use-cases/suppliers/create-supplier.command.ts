import { Identifier } from '@packages/shared-kernel';
import { Supplier, SupplierContact } from '@packages/domain-purchasing';
import { SupplierRepository } from '../../ports';

export interface CreateSupplierInput {
  companyId: string;
  name: { ar: string; en?: string };
  phone: string;
  email?: string | null;
  address?: string | null;
  taxId?: string | null;
  paymentTermsDays?: number;
  currency?: string;
  contacts?: Array<{ name: string; phone: string; email?: string | null; role?: string | null }>;
}

export class CreateSupplierCommand {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(input: CreateSupplierInput): Promise<Supplier> {
    const existing = await this.repo.findByPhone(input.phone, input.companyId);
    if (existing) {
      throw new Error('Supplier with this phone number already exists');
    }

    const contacts = (input.contacts ?? []).map((c) =>
      SupplierContact.create({
        name: c.name,
        phone: c.phone,
        email: c.email ?? null,
        role: c.role ?? null,
      }),
    );

    const supplier = Supplier.create({
      companyId: input.companyId,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      address: input.address ?? null,
      taxId: input.taxId ?? null,
      paymentTermsDays: input.paymentTermsDays ?? 0,
      currency: input.currency ?? 'EGP',
      contacts,
    });

    await this.repo.save(supplier);
    return supplier;
  }
}
