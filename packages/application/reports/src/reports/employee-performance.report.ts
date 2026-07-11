import { EmployeePerformanceSnapshotRepository } from '../ports';

export interface EmployeePerformanceInput {
  companyId: string;
  branchId: string;
  from: string;
  to: string;
}

export interface EmployeePerformanceOutput {
  branchId: string;
  from: string;
  to: string;
  employees: {
    employeeId: string;
    ordersHandled: number;
    totalSales: number;
    totalReturns: number;
    returnRate: number;
    averageSaleValue: number;
  }[];
}

export class EmployeePerformanceReport {
  constructor(private readonly performanceRepo: EmployeePerformanceSnapshotRepository) {}

  async execute(input: EmployeePerformanceInput): Promise<EmployeePerformanceOutput> {
    const fromDate = input.from.slice(0, 10);
    const toDate = input.to.slice(0, 10);
    const snapshots = await this.performanceRepo.findByCompanyBranchDateRange(
      input.companyId,
      input.branchId,
      fromDate,
      toDate,
    );

    const employeeMap = new Map<string, { ordersHandled: number; totalSales: number; totalReturns: number }>();
    for (const snapshot of snapshots) {
      const existing = employeeMap.get(snapshot.employeeId) ?? { ordersHandled: 0, totalSales: 0, totalReturns: 0 };
      existing.ordersHandled += snapshot.ordersHandled;
      existing.totalSales += snapshot.totalSalesPiasters;
      existing.totalReturns += snapshot.totalReturnsPiasters;
      employeeMap.set(snapshot.employeeId, existing);
    }

    const employees = Array.from(employeeMap.entries()).map(([employeeId, data]) => ({
      employeeId,
      ordersHandled: data.ordersHandled,
      totalSales: data.totalSales,
      totalReturns: data.totalReturns,
      returnRate: data.ordersHandled > 0 ? (data.totalReturns / (data.totalSales || 1)) * 100 : 0,
      averageSaleValue: data.ordersHandled > 0 ? data.totalSales / data.ordersHandled : 0,
    }));

    return { branchId: input.branchId, from: input.from, to: input.to, employees };
  }
}
