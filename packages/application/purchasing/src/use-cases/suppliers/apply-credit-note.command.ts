import { Identifier } from '@packages/shared-kernel';
import { SupplierLedgerEntry } from '@packages/domain-purchasing';
import { SupplierLedgerEntryRepository, SupplierRepository } from '../../ports';

export interface ApplySupplierCreditNoteInput {
  supplierId: string;
  companyId: string;
  amountPiasters: number;
  referenceNumber?: string | null;
  reason: string;
}

export interface ApplySupplierCreditNoteResult {
  ledgerEntry: SupplierLedgerEntry;
}

export class ApplySupplierCreditNoteCommand {
  constructor(
    private readonly ledgerRepo: SupplierLedgerEntryRepository,
    private readonly supplierRepo: SupplierRepository,
  ) {}

  async execute(input: ApplySupplierCreditNoteInput): Promise<ApplySupplierCreditNoteResult> {
    if (input.amountPiasters <= 0) {
      throw new Error('Credit note amount must be positive');
    }

    const supplier = await this.supplierRepo.findById(input.supplierId, input.companyId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const entry = SupplierLedgerEntry.create({
      supplierId: input.supplierId,
      companyId: input.companyId,
      eventType: 'credit_note',
      amountPiasters: -input.amountPiasters,
      referenceType: 'CreditNote',
      referenceId: input.referenceNumber ?? null,
      notes: input.reason,
      occurredAt: new Date().toISOString(),
    });

    await this.ledgerRepo.append(entry);
    return { ledgerEntry: entry };
  }
}
