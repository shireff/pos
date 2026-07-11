import { getReportsRepos } from './ports';

export interface KpiDefinition {
  name: string;
  label: string;
  formula: (data: Record<string, unknown>) => number;
  dataSource: string;
  format: 'currency' | 'percentage' | 'number' | 'decimal';
  unit?: string;
}

export interface KpiResult {
  name: string;
  label: string;
  value: number;
  format: 'currency' | 'percentage' | 'number' | 'decimal';
  unit?: string;
}

const KPI_DEFINITIONS: KpiDefinition[] = [
  {
    name: 'grossRevenue',
    label: 'Gross Revenue',
    formula: (data) => (data.grossRevenuePiasters as number) ?? 0,
    dataSource: 'daily_sales_rollup',
    format: 'currency',
  },
  {
    name: 'netRevenue',
    label: 'Net Revenue',
    formula: (data) => ((data.grossRevenuePiasters as number) ?? 0) - ((data.discountAmountPiasters as number) ?? 0),
    dataSource: 'daily_sales_rollup',
    format: 'currency',
  },
  {
    name: 'grossProfit',
    label: 'Gross Profit',
    formula: (data) => ((data.grossRevenuePiasters as number) ?? 0) - ((data.cogsPiasters as number) ?? 0),
    dataSource: 'daily_sales_rollup',
    format: 'currency',
  },
  {
    name: 'grossMarginPercent',
    label: 'Gross Margin %',
    formula: (data) => {
      const revenue = (data.grossRevenuePiasters as number) ?? 0;
      const cogs = (data.cogsPiasters as number) ?? 0;
      if (revenue === 0) return 0;
      return ((revenue - cogs) / revenue) * 100;
    },
    dataSource: 'daily_sales_rollup',
    format: 'percentage',
  },
  {
    name: 'transactionCount',
    label: 'Transactions',
    formula: (data) => (data.transactionCount as number) ?? 0,
    dataSource: 'daily_sales_rollup',
    format: 'number',
  },
  {
    name: 'averageOrderValue',
    label: 'Average Order Value',
    formula: (data) => {
      const count = (data.transactionCount as number) ?? 0;
      if (count === 0) return 0;
      return ((data.grossRevenuePiasters as number) ?? 0) / count;
    },
    dataSource: 'daily_sales_rollup',
    format: 'currency',
  },
  {
    name: 'returnsCount',
    label: 'Returns',
    formula: (data) => (data.returnsCount as number) ?? 0,
    dataSource: 'daily_sales_rollup',
    format: 'number',
  },
  {
    name: 'returnsRate',
    label: 'Return Rate',
    formula: (data) => {
      const count = (data.transactionCount as number) ?? 0;
      const returns = (data.returnsCount as number) ?? 0;
      if (count === 0) return 0;
      return (returns / count) * 100;
    },
    dataSource: 'daily_sales_rollup',
    format: 'percentage',
  },
  {
    name: 'loyaltyRedemptionRate',
    label: 'Loyalty Redemption Rate',
    formula: (data) => {
      const redeemed = (data.totalPointsRedeemed as number) ?? 0;
      const earned = (data.totalPointsEarned as number) ?? 0;
      if (earned === 0) return 0;
      return (redeemed / earned) * 100;
    },
    dataSource: 'customer_loyalty_snapshot',
    format: 'percentage',
  },
  {
    name: 'stockTurnoverRate',
    label: 'Stock Turnover',
    formula: (data) => (data.stockTurnover as number) ?? 0,
    dataSource: 'inventory_valuation_snapshot',
    format: 'decimal',
  },
  {
    name: 'daysInventoryOutstanding',
    label: 'Days Inventory Outstanding',
    formula: (data) => (data.dio as number) ?? 0,
    dataSource: 'inventory_valuation_snapshot',
    format: 'number',
  },
];

export class KpiRegistry {
  constructor(private readonly repos = getReportsRepos()) {}

  async computeAll(companyId: string, branchId: string, date: string): Promise<KpiResult[]> {
    const [dailyRollup, monthlyRollup, loyaltySnapshot] = await Promise.all([
      this.repos.dailySalesRollupRepo.findByCompanyBranchDate(companyId, branchId, date),
      this.repos.monthlySalesRollupRepo.findByCompanyBranchYearMonth(companyId, branchId, new Date(date).getFullYear(), new Date(date).getMonth() + 1),
      this.repos.customerLoyaltyRepo.findByCompanyCustomerSnapshotDate(companyId, '', date),
    ]);

    const dailyData: Record<string, unknown> = dailyRollup ? {
      grossRevenuePiasters: dailyRollup.grossRevenuePiasters,
      taxAmountPiasters: dailyRollup.taxAmountPiasters,
      discountAmountPiasters: dailyRollup.discountAmountPiasters,
      transactionCount: dailyRollup.transactionCount,
      returnsCount: 0,
    } : {};

    const monthlyData: Record<string, unknown> = monthlyRollup ? {
      grossRevenuePiasters: monthlyRollup.grossRevenuePiasters,
      cogsPiasters: 0,
    } : {};

    const loyaltyData: Record<string, unknown> = loyaltySnapshot ? {
      totalPointsEarned: loyaltySnapshot.totalPointsEarned,
      totalPointsRedeemed: loyaltySnapshot.totalPointsRedeemed,
    } : {};

    return KPI_DEFINITIONS.map((def) => ({
      name: def.name,
      label: def.label,
      value: def.formula(def.dataSource === 'daily_sales_rollup' ? dailyData : def.dataSource === 'customer_loyalty_snapshot' ? loyaltyData : monthlyData),
      format: def.format,
      unit: def.unit,
    }));
  }
}

export function getKpiDefinition(name: string): KpiDefinition | undefined {
  return KPI_DEFINITIONS.find((k) => k.name === name);
}
