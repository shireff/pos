import { Identifier } from '@packages/shared-kernel';

export interface CustomerMergeResult {
  targetCustomerId: string;
  sourceCustomerId: string;
  movedLoyaltyEvents: number;
  movedCreditEntries: number;
  movedOrders: number;
}

export class CustomerMergeService {
  public static validate(sourceId: string, targetId: string): void {
    if (sourceId === targetId) {
      throw new Error('Source and target customers must differ');
    }
  }

  public static buildResult(
    targetId: string,
    sourceId: string,
    movedLoyaltyEvents: number,
    movedCreditEntries: number,
    movedOrders: number,
  ): CustomerMergeResult {
    return {
      targetCustomerId: targetId,
      sourceCustomerId: sourceId,
      movedLoyaltyEvents,
      movedCreditEntries,
      movedOrders,
    };
  }
}
