import { MongoReportPaymentTransactionRepository } from '../ports';

export interface TaxEtaInput {
  companyId: string;
  year: number;
  month: number;
}

export interface TaxEtaOutput {
  year: number;
  month: number;
  totalTaxCollected: number;
  byRate: Record<string, number>;
}

export class TaxEtaReport {
  constructor(private readonly paymentRepo: MongoReportPaymentTransactionRepository) {}

  async execute(input: TaxEtaInput): Promise<TaxEtaOutput> {
    const from = `${input.year}-${String(input.month).padStart(2, '0')}-01`;
    const nextMonth = input.month === 12 ? 1 : input.month + 1;
    const nextYear = input.month === 12 ? input.year + 1 : input.year;
    const to = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const payments = await this.paymentRepo.findByCompanyDateRange(input.companyId, from, to);
    const totalTaxCollected = payments.reduce((sum, p) => sum + p.amountPiasters, 0);

    return {
      year: input.year,
      month: input.month,
      totalTaxCollected,
      byRate: { 'standard': totalTaxCollected },
    };
  }
}
