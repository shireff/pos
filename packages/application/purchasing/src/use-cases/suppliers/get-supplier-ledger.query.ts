import { SupplierLedgerEntry } from '@packages/domain-purchasing';
import { SupplierLedgerEntryRepository } from '../../ports';

export interface GetSupplierLedgerInput {
  supplierId: string;
  companyId: string;
  limit?: number;
  offset?: number;
}

export interface GetSupplierLedgerResult {
  entries: SupplierLedgerEntry[];
  total: number;
  runningBalance: number;
}

export class GetSupplierLedgerQuery {
  constructor(private readonly ledgerRepo: SupplierLedgerEntryRepository) {}

  async execute(input: GetSupplierLedgerInput): Promise<GetSupplierLedgerResult> {
    const limit = input.limit ?? 50;
    const offset = input.offset ?? 0;

    const entries = await this.ledgerRepo.findBySupplier(
      input.supplierId,
      input.companyId,
      limit,
      offset,
    );

    const total = await this.ledgerRepo.countBySupplier(input.supplierId, input.companyId);

    const runningBalance = entries.reduce((sum, entry) => sum + entry.amountPiasters, 0);

    return {
      entries,
      total,
      runningBalance,
    };
  }
}
