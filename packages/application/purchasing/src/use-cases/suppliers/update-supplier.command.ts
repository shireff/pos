import { Supplier, SupplierContact } from '@packages/domain-purchasing';
import { SupplierRepository } from '../../ports';

export interface UpdateSupplierInput {
  supplierId: string;
  companyId: string;
  name?: { ar: string; en?: string };
  phone?: string;
  email?: string | null;
  address?: string | null;
  taxId?: string | null;
  paymentTermsDays?: number;
  currency?: string;
  contacts?: Array<{ name: string; phone: string; email?: string | null; role?: string | null }>;
}

export class UpdateSupplierCommand {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(input: UpdateSupplierInput): Promise<Supplier> {
    const supplier = await this.repo.findById(input.supplierId, input.companyId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    if (input.phone !== undefined && input.phone !== supplier.phone) {
      const existing = await this.repo.findByPhone(input.phone, input.companyId);
      if (existing && existing.id !== supplier.id) {
        throw new Error('Supplier with this phone number already exists');
      }
    }

    supplier.update({
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      taxId: input.taxId,
      paymentTermsDays: input.paymentTermsDays,
      currency: input.currency,
    });

    if (input.contacts !== undefined) {
      const contacts = input.contacts.map((c) =>
        SupplierContact.create({
          name: c.name,
          phone: c.phone,
          email: c.email ?? null,
          role: c.role ?? null,
        }),
      );
      supplier.replaceContacts(contacts);
    }

    await this.repo.save(supplier);
    return supplier;
  }
}
