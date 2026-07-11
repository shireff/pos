import {
  MongoDailySalesRollupRepository,
  MongoReportOrderRepository,
} from '../ports';

export interface DailySalesSummaryInput {
  companyId: string;
  branchId: string;
  date: string;
}

export interface DailySalesSummaryOutput {
  date: string;
  branchId: string;
  totalOrders: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
  paymentMethodSplit: Record<string, number>;
}

export class DailySalesSummaryReport {
  constructor(
    private readonly dailyRepo: MongoDailySalesRollupRepository,
    private readonly orderRepo: MongoReportOrderRepository,
  ) {}

  async execute(input: DailySalesSummaryInput): Promise<DailySalesSummaryOutput> {
    const rollup = await this.dailyRepo.findByCompanyBranchDate(input.companyId, input.branchId, input.date);
    const orders = await this.orderRepo.findByCompanyBranchDateRange(
      input.companyId,
      input.branchId,
      input.date,
      `${input.date}T23:59:59.999Z`,
    );

    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    const paymentMap = new Map<string, number>();

    for (const order of orders) {
      paymentMap.set('cash', (paymentMap.get('cash') ?? 0) + order.grandTotalPiasters);
      productMap.set(`order-${order.id}`, { name: `Order ${order.id.slice(0, 8)}`, quantity: 1, revenue: order.grandTotalPiasters });
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({ productId: '', name: p.name, quantity: p.quantity, revenue: p.revenue }));

    return {
      date: input.date,
      branchId: input.branchId,
      totalOrders: rollup?.transactionCount ?? orders.length,
      totalRevenue: rollup?.grossRevenuePiasters ?? orders.reduce((s, o) => s + o.grandTotalPiasters, 0),
      totalTax: rollup?.taxAmountPiasters ?? orders.reduce((s, o) => s + o.taxTotalPiasters, 0),
      totalDiscount: rollup?.discountAmountPiasters ?? orders.reduce((s, o) => s + o.discountTotalPiasters, 0),
      topProducts,
      paymentMethodSplit: Object.fromEntries(paymentMap),
    };
  }
}
