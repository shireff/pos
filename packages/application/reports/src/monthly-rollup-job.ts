import { getReportsRepos, MongoDailySalesRollupRepository, MongoMonthlySalesRollupRepository } from './ports';

export interface MonthlyRollupInput {
  companyId: string;
  branchId: string;
  year: number;
  month: number;
}

export class MonthlyRollupJob {
  private readonly dailyRepo: MongoDailySalesRollupRepository;
  private readonly monthlyRepo: MongoMonthlySalesRollupRepository;

  constructor(
    dailyRepo?: MongoDailySalesRollupRepository,
    monthlyRepo?: MongoMonthlySalesRollupRepository,
  ) {
    const repos = getReportsRepos();
    this.dailyRepo = dailyRepo ?? repos.dailySalesRollupRepo;
    this.monthlyRepo = monthlyRepo ?? repos.monthlySalesRollupRepo;
  }

  async execute(input: MonthlyRollupInput): Promise<void> {
    const fromDate = `${input.year}-${String(input.month).padStart(2, '0')}-01`;
    const nextMonth = input.month === 12 ? 1 : input.month + 1;
    const nextYear = input.month === 12 ? input.year + 1 : input.year;
    const toDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const dailyRollups = await this.dailyRepo.findByCompanyBranchDateRange(
      input.companyId,
      input.branchId,
      fromDate,
      toDate,
    );

    const aggregated = dailyRollups.reduce(
      (acc: { grossRevenuePiasters: number; taxAmountPiasters: number; discountAmountPiasters: number; transactionCount: number }, day: { grossRevenuePiasters: number; taxAmountPiasters: number; discountAmountPiasters: number; transactionCount: number }) => ({
        grossRevenuePiasters: acc.grossRevenuePiasters + day.grossRevenuePiasters,
        taxAmountPiasters: acc.taxAmountPiasters + day.taxAmountPiasters,
        discountAmountPiasters: acc.discountAmountPiasters + day.discountAmountPiasters,
        transactionCount: acc.transactionCount + day.transactionCount,
      }),
      { grossRevenuePiasters: 0, taxAmountPiasters: 0, discountAmountPiasters: 0, transactionCount: 0 },
    );

    await this.monthlyRepo.upsert({
      id: `${input.companyId}-${input.branchId}-${input.year}-${input.month}`,
      companyId: input.companyId,
      branchId: input.branchId,
      year: input.year,
      month: input.month,
      grossRevenuePiasters: aggregated.grossRevenuePiasters,
      taxAmountPiasters: aggregated.taxAmountPiasters,
      discountAmountPiasters: aggregated.discountAmountPiasters,
      transactionCount: aggregated.transactionCount,
    });
  }
}
