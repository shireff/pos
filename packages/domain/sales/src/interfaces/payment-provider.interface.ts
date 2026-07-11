import { TenderType } from '../value-objects';

export type PaymentTransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';

export interface ProcessPaymentRequest {
  orderId: string;
  tenderType: TenderType;
  amountPiasters: number;
  providerReference?: string | null;
}

export interface PaymentResult {
  success: boolean;
  externalReference?: string;
  message?: string;
}

export interface RefundPaymentRequest {
  transactionId: string;
  amountPiasters: number;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  externalReference?: string;
  message?: string;
}

export interface ProviderStatus {
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  externalReference?: string;
}

export interface IPaymentProvider {
  process(request: ProcessPaymentRequest): Promise<PaymentResult>;
  refund(request: RefundPaymentRequest): Promise<RefundResult>;
  getStatus(transactionId: string): Promise<ProviderStatus>;
}
