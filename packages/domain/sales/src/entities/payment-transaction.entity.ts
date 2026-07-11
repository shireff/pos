import { Identifier } from '@packages/shared-kernel';
import { TenderType, PaymentTransactionStatus } from '../value-objects';

export interface PaymentTransactionProps {
  id: string;
  companyId: string;
  orderId: string;
  tenderType: TenderType;
  amountPiasters: number;
  providerId: string | null;
  status: PaymentTransactionStatus;
  externalReference: string | null;
  processedAt: string | null;
  createdAt: string;
}

export class PaymentTransaction {
  public readonly id: string;
  public readonly companyId: string;
  public readonly orderId: string;
  public readonly tenderType: TenderType;
  public readonly amountPiasters: number;
  public readonly providerId: string | null;
  public readonly status: PaymentTransactionStatus;
  public readonly externalReference: string | null;
  public readonly processedAt: string | null;
  public readonly createdAt: string;

  private constructor(props: PaymentTransactionProps) {
    if (props.amountPiasters <= 0) throw new Error('PaymentTransaction amount must be positive');
    this.id = props.id;
    this.companyId = props.companyId;
    this.orderId = props.orderId;
    this.tenderType = props.tenderType;
    this.amountPiasters = props.amountPiasters;
    this.providerId = props.providerId;
    this.status = props.status;
    this.externalReference = props.externalReference;
    this.processedAt = props.processedAt;
    this.createdAt = props.createdAt;
  }

  public static create(props: Omit<PaymentTransactionProps, 'id' | 'createdAt'>): PaymentTransaction {
    return new PaymentTransaction({
      id: Identifier.generate(),
      createdAt: new Date().toISOString(),
      ...props,
    });
  }

  public static reconstitute(props: PaymentTransactionProps): PaymentTransaction {
    return new PaymentTransaction(props);
  }

  public get isCompleted(): boolean {
    return this.status === 'completed';
  }

  public get isRefundable(): boolean {
    return this.status === 'completed' || this.status === 'partially_refunded';
  }
}
