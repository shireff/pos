import { MongoReportPaymentTransactionRepository } from '../ports';

export interface CashFlowInput {
  companyId: string;
  from: string;
  to: string;
}

export interface CashFlowOutput {
  from: string;
  to: string;
  inflow: number;
  outflow: number;
  byTender: Record<string, number>;
}

export class CashFlowScaffold {
  constructor(private readonly paymentRepo: MongoReportPaymentTransactionRepository) {}

  async execute(input: CashFlowInput): Promise<CashFlowOutput> {
    const payments = await this.paymentRepo.findByCompanyDateRange(input.companyId, input.from, input.to);
    const inflow = payments.reduce((sum, p) => sum + p.amountPiasters, 0);
    const byTender: Record<string, number> = {};
    for (const payment of payments) {
      byTender[payment.tenderType] = (byTender[payment.tenderType] ?? 0) + payment.amountPiasters;
    }
    return {
      from: input.from,
      to: input.to,
      inflow,
      outflow: 0,
      byTender,
    };
  }
}
