import { Identifier } from '@packages/shared-kernel';
import { SupplierLedgerEntry } from '@packages/domain-purchasing';
import { SupplierLedgerEntryRepository, SupplierRepository } from '../../ports';

export interface RecordSupplierPaymentInput {
  supplierId: string;
  companyId: string;
  amountPiasters: number;
  paymentMethod: string;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface RecordSupplierPaymentResult {
  ledgerEntry: SupplierLedgerEntry;
}

export class RecordSupplierPaymentCommand {
  constructor(
    private readonly ledgerRepo: SupplierLedgerEntryRepository,
    private readonly supplierRepo: SupplierRepository,
  ) {}

  async execute(input: RecordSupplierPaymentInput): Promise<RecordSupplierPaymentResult> {
    if (input.amountPiasters <= 0) {
      throw new Error('Payment amount must be positive');
    }

    const supplier = await this.supplierRepo.findById(input.supplierId, input.companyId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const entry = SupplierLedgerEntry.create({
      supplierId: input.supplierId,
      companyId: input.companyId,
      eventType: 'payment',
      amountPiasters: -input.amountPiasters,
      referenceType: 'Payment',
      referenceId: input.referenceNumber ?? null,
      notes: input.notes ?? `Payment via ${input.paymentMethod}`,
      occurredAt: new Date().toISOString(),
    });

    await this.ledgerRepo.append(entry);
    return { ledgerEntry: entry };
  }
}
