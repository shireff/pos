import { Money } from '@packages/shared-kernel';

export class CreditLimitGuardService {
  public static verify(
    currentBalancePiasters: number,
    saleTotalPiasters: number,
    creditLimitPiasters: number,
  ): void {
    const newBalance = currentBalancePiasters + saleTotalPiasters;
    if (newBalance > creditLimitPiasters) {
      throw new Error(
        `Credit limit exceeded for this sale. New balance ${newBalance} EGP exceeds limit ${creditLimitPiasters} EGP`,
      );
    }
  }
}
