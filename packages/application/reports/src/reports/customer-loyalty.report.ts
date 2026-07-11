import { MongoCustomerLoyaltySnapshotRepository } from '../ports';

export interface CustomerLoyaltyInput {
  companyId: string;
  from: string;
  to: string;
}

export interface CustomerLoyaltyOutput {
  from: string;
  to: string;
  tierDistribution: Record<string, number>;
  redemptionRate: number;
  acquisitionRate: number;
  totalCustomers: number;
}

export class CustomerLoyaltyReport {
  constructor(private readonly loyaltyRepo: MongoCustomerLoyaltySnapshotRepository) {}

  async execute(input: CustomerLoyaltyInput): Promise<CustomerLoyaltyOutput> {
    const fromDate = input.from.slice(0, 10);
    const toDate = input.to.slice(0, 10);
    const snapshots = await this.loyaltyRepo.findByCompanyDateRange(input.companyId, fromDate, toDate);

    const tierDistribution: Record<string, number> = {};
    let totalPointsEarned = 0;
    let totalPointsRedeemed = 0;
    const customerIds = new Set<string>();

    for (const snapshot of snapshots) {
      customerIds.add(snapshot.customerId);
      const tier = snapshot.tier ?? 'standard';
      tierDistribution[tier] = (tierDistribution[tier] ?? 0) + 1;
      totalPointsEarned += snapshot.totalPointsEarned;
      totalPointsRedeemed += snapshot.totalPointsRedeemed;
    }

    const redemptionRate = totalPointsEarned > 0 ? (totalPointsRedeemed / totalPointsEarned) * 100 : 0;

    return {
      from: input.from,
      to: input.to,
      tierDistribution,
      redemptionRate,
      acquisitionRate: 0,
      totalCustomers: customerIds.size,
    };
  }
}
