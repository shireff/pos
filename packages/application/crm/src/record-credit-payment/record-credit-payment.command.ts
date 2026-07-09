import { CreditLedger, CreditLedgerEntry } from '@packages/domain-crm';
import { CreditLedgerBalanceRepository, CreditLedgerRepository } from '../ports';
import { CreditEventType } from '@packages/domain-crm';

export interface RecordCreditPaymentInput {
  companyId: string;
  customerId: string;
  amountPiasters: number;
  paymentMethod: string;
  referenceNumber?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
}

export interface RecordCreditPaymentResult {
  entry: CreditLedgerEntry;
  newBalance: number;
}

export class RecordCreditPaymentCommand {
  constructor(
    private readonly creditLedgerRepo: CreditLedgerBalanceRepository,
    private readonly creditEntryRepo: CreditLedgerRepository,
  ) {}

  async execute(input: RecordCreditPaymentInput): Promise<RecordCreditPaymentResult> {
    let ledger = await this.creditLedgerRepo.findByCustomer(input.customerId, input.companyId);
    if (!ledger) {
      throw new Error('Credit ledger not found for customer');
    }

    ledger.applyPayment(input.amountPiasters);
    await this.creditLedgerRepo.save(ledger);

    const entry = CreditLedgerEntry.create({
      companyId: input.companyId,
      customerId: input.customerId,
      eventType: 'payment',
      amountPiasters: -input.amountPiasters,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber ?? null,
      occurredAt: new Date().toISOString(),
    });

    await this.creditEntryRepo.append(entry);

    return {
      entry,
      newBalance: ledger.balancePiasters,
    };
  }
}
