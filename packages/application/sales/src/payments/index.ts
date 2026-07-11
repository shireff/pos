import { PaymentTransaction, PaymentMethod, TenderType } from '@packages/domain-sales';
import { PaymentTransactionRepository, PaymentMethodRepository } from '../ports';

export interface ProcessPaymentInput {
  companyId: string;
  orderId: string;
  tenders: Array<{
    tenderType: TenderType;
    amountPiasters: number;
    providerReference?: string | null;
  }>;
}

export interface ProcessPaymentResult {
  transactions: PaymentTransaction[];
}

export class ProcessPaymentCommand {
  constructor(
    private readonly paymentTransactionRepo: PaymentTransactionRepository,
    private readonly paymentMethodRepo: PaymentMethodRepository,
  ) {}

  async execute(input: ProcessPaymentInput): Promise<ProcessPaymentResult> {
    if (input.tenders.length === 0) {
      throw new Error('At least one tender is required');
    }

    const methods = await this.paymentMethodRepo.findByCompany(input.companyId);
    const enabledTypes = new Set(methods.filter((m) => m.isEnabled).map((m) => m.tenderType));

    const transactions: PaymentTransaction[] = [];
    const now = new Date().toISOString();

    for (const tender of input.tenders) {
      if (!enabledTypes.has(tender.tenderType)) {
        throw new Error(`Payment method ${tender.tenderType} is not enabled for this company`);
      }

      const transaction = PaymentTransaction.create({
        companyId: input.companyId,
        orderId: input.orderId,
        tenderType: tender.tenderType,
        amountPiasters: tender.amountPiasters,
        providerId: null,
        status: 'completed',
        externalReference: tender.providerReference ?? null,
        processedAt: now,
      });

      await this.paymentTransactionRepo.save(transaction);
      transactions.push(transaction);
    }

    return { transactions };
  }
}

export interface RefundPaymentInput {
  companyId: string;
  orderId: string;
  transactionId: string;
  amountPiasters: number;
  reason?: string;
}

export interface RefundPaymentResult {
  transaction: PaymentTransaction;
}

export class RefundPaymentCommand {
  constructor(private readonly paymentTransactionRepo: PaymentTransactionRepository) {}

  async execute(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const original = await this.paymentTransactionRepo.findById(input.transactionId);
    if (!original) {
      throw new Error(`Payment transaction ${input.transactionId} not found`);
    }
    if (original.orderId !== input.orderId) {
      throw new Error('Transaction does not belong to the specified order');
    }
    if (!original.isRefundable) {
      throw new Error(`Payment transaction is not refundable (status: ${original.status})`);
    }
    if (input.amountPiasters <= 0) {
      throw new Error('Refund amount must be positive');
    }
    if (input.amountPiasters > original.amountPiasters) {
      throw new Error('Refund amount cannot exceed original transaction amount');
    }

    const now = new Date().toISOString();
    const refundTransaction = PaymentTransaction.create({
      companyId: input.companyId,
      orderId: input.orderId,
      tenderType: original.tenderType,
      amountPiasters: input.amountPiasters,
      providerId: original.providerId,
      status: original.amountPiasters === input.amountPiasters ? 'refunded' : 'partially_refunded',
      externalReference: original.externalReference,
      processedAt: now,
    });

    await this.paymentTransactionRepo.save(refundTransaction);
    return { transaction: refundTransaction };
  }
}

export interface GetPaymentMethodsInput {
  companyId: string;
}

export class GetPaymentMethodsQuery {
  constructor(private readonly paymentMethodRepo: PaymentMethodRepository) {}

  async execute(input: GetPaymentMethodsInput): Promise<PaymentMethod[]> {
    return this.paymentMethodRepo.findByCompany(input.companyId);
  }
}
