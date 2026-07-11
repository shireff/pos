import { MongoMonthlySalesRollupRepository } from '../ports';

export interface ProfitAndLossInput {
  companyId: string;
  branchId?: string;
  year: number;
  month: number;
}

export interface ProfitAndLossOutput {
  year: number;
  month: number;
  branchId: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export class ProfitAndLossReport {
  constructor(private readonly monthlyRepo: MongoMonthlySalesRollupRepository) {}

  async execute(input: ProfitAndLossInput): Promise<ProfitAndLossOutput> {
    const branchId = input.branchId ?? 'all';
    const rollup = await this.monthlyRepo.findByCompanyBranchYearMonth(
      input.companyId,
      branchId,
      input.year,
      input.month,
    );

    const revenue = rollup?.grossRevenuePiasters ?? 0;
    const cogs = 0;
    const expenses = 0;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;

    return {
      year: input.year,
      month: input.month,
      branchId,
      revenue,
      cogs,
      grossProfit,
      expenses,
      netProfit,
    };
  }
}
