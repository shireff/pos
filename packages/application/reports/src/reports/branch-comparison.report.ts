import { MongoDailySalesRollupRepository } from '../ports';

export interface BranchComparisonInput {
  companyId: string;
  from: string;
  to: string;
}

export interface BranchComparisonOutput {
  from: string;
  to: string;
  branches: {
    branchId: string;
    revenue: number;
    transactionCount: number;
    averageOrderValue: number;
  }[];
}

export class BranchComparisonReport {
  constructor(
    private readonly dailyRepo: MongoDailySalesRollupRepository,
  ) {}

  async execute(input: BranchComparisonInput): Promise<BranchComparisonOutput> {
    const fromDate = input.from.slice(0, 10);
    const toDate = input.to.slice(0, 10);
    const dailyRollups = await this.dailyRepo.findByCompanyBranchDateRange(input.companyId, '', fromDate, toDate);

    const branchMap = new Map<string, { revenue: number; transactionCount: number }>();
    for (const rollup of dailyRollups) {
      const existing = branchMap.get(rollup.branchId) ?? { revenue: 0, transactionCount: 0 };
      existing.revenue += rollup.grossRevenuePiasters;
      existing.transactionCount += rollup.transactionCount;
      branchMap.set(rollup.branchId, existing);
    }

    const branches = Array.from(branchMap.entries()).map(([branchId, data]) => ({
      branchId,
      revenue: data.revenue,
      transactionCount: data.transactionCount,
      averageOrderValue: data.transactionCount > 0 ? data.revenue / data.transactionCount : 0,
    }));

    return { from: input.from, to: input.to, branches };
  }
}
