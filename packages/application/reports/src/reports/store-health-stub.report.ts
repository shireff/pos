import { ReportsRepos } from '../ports';

export interface StoreHealthInput {
  companyId: string;
}

export interface StoreHealthOutput {
  overallScore: number;
  alerts: { severity: string; message: string }[];
  summary: string;
}

export class StoreHealthDashboardStub {
  constructor(private readonly repos: ReportsRepos) {}

  async execute(input: StoreHealthInput): Promise<StoreHealthOutput> {
    const today = new Date().toISOString().slice(0, 10);
    const alerts: StoreHealthOutput['alerts'] = [];
    let overallScore = 100;

    try {
      const snapshots = await this.repos.inventoryValuationRepo.findByCompanyWarehouseDate(
        input.companyId,
        'all',
        today,
      );
      const outOfStock = snapshots.filter((s) => s.quantityOnHand <= 0).length;
      if (outOfStock > 0) {
        alerts.push({ severity: 'warning', message: `${outOfStock} item(s) out of stock` });
        overallScore -= Math.min(30, outOfStock * 5);
      }
    } catch {
      alerts.push({ severity: 'info', message: 'Inventory valuation unavailable' });
    }

    return {
      overallScore: Math.max(0, overallScore),
      alerts,
      summary: 'AI narrative will be available in Phase 15.',
    };
  }
}
