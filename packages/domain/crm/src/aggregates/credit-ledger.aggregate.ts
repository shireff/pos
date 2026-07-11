import { Money } from '@packages/shared-kernel';

export interface CreditLedgerProps {
  companyId: string;
  customerId: string;
  balancePiasters: number;
  creditLimitPiasters: number;
}

export class CreditLedger {
  public readonly companyId: string;
  public readonly customerId: string;
  public balancePiasters: number;
  public creditLimitPiasters: number;

  private constructor(props: CreditLedgerProps) {
    this.companyId = props.companyId;
    this.customerId = props.customerId;
    this.balancePiasters = props.balancePiasters;
    this.creditLimitPiasters = props.creditLimitPiasters;
  }

  public static create(companyId: string, customerId: string, creditLimitPiasters: number): CreditLedger {
    return new CreditLedger({
      companyId,
      customerId,
      balancePiasters: 0,
      creditLimitPiasters,
    });
  }

  public static reconstitute(props: CreditLedgerProps): CreditLedger {
    return new CreditLedger(props);
  }

  public applyPurchaseOnCredit(amountPiasters: number): void {
    if (amountPiasters <= 0) throw new Error('Purchase on credit amount must be positive');
    const newBalance = this.balancePiasters + amountPiasters;
    if (newBalance > this.creditLimitPiasters) {
      throw new Error(
        `Credit limit exceeded: new balance ${newBalance} > limit ${this.creditLimitPiasters}`,
      );
    }
    this.balancePiasters = newBalance;
  }

  public applyPayment(amountPiasters: number): void {
    if (amountPiasters <= 0) throw new Error('Payment amount must be positive');
    this.balancePiasters = Math.max(0, this.balancePiasters - amountPiasters);
  }

  public applyCreditNote(amountPiasters: number): void {
    if (amountPiasters <= 0) throw new Error('Credit note amount must be positive');
    this.balancePiasters = Math.max(0, this.balancePiasters - amountPiasters);
  }

  public applyAdjustment(deltaPiasters: number): void {
    this.balancePiasters = Math.max(0, this.balancePiasters + deltaPiasters);
  }

  public updateCreditLimit(newLimitPiasters: number): void {
    if (newLimitPiasters < 0) throw new Error('Credit limit cannot be negative');
    if (this.balancePiasters > newLimitPiasters) {
      throw new Error(
        `Cannot reduce credit limit below current balance: ${this.balancePiasters} > ${newLimitPiasters}`,
      );
    }
    this.creditLimitPiasters = newLimitPiasters;
  }
}
