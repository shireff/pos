export interface OnTimeDeliveryRateResult {
  onTimeCount: number;
  totalCount: number;
  rate: number;
}

export class SupplierPerformanceService {
  public static computeOnTimeDeliveryRate(
    receipts: Array<{ receivedDate: string; expectedDeliveryDate: string }>,
  ): OnTimeDeliveryRateResult {
    if (receipts.length === 0) {
      return { onTimeCount: 0, totalCount: 0, rate: 0 };
    }

    let onTimeCount = 0;
    for (const receipt of receipts) {
      if (new Date(receipt.receivedDate) <= new Date(receipt.expectedDeliveryDate)) {
        onTimeCount++;
      }
    }

    const rate = (onTimeCount / receipts.length) * 100;
    return {
      onTimeCount,
      totalCount: receipts.length,
      rate: Math.round(rate * 100) / 100,
    };
  }

  public static computePriceVariance(currentPrice: number, referencePrice: number): number {
    if (referencePrice === 0) return 0;
    return ((currentPrice - referencePrice) / referencePrice) * 100;
  }

  public static generateNarrativeStub(
    onTimeRate: number,
    priceVariance: number,
  ): string {
    const parts: string[] = [];
    if (onTimeRate >= 90) {
      parts.push('excellent on-time delivery performance');
    } else if (onTimeRate >= 70) {
      parts.push('acceptable on-time delivery rate');
    } else {
      parts.push('below-average on-time delivery rate');
    }

    if (Math.abs(priceVariance) <= 5) {
      parts.push('stable pricing');
    } else if (priceVariance > 5) {
      parts.push('prices trending higher than reference');
    } else {
      parts.push('prices trending lower than reference');
    }

    return `Supplier performance: ${parts.join('; ')}. Detailed analysis will be available in Phase 15.`;
  }
}
