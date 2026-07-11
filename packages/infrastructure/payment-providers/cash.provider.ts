import { IPaymentProvider, PaymentResult, RefundResult, ProviderStatus, ProcessPaymentRequest, RefundPaymentRequest } from '@packages/domain-sales';

export class CashProvider implements IPaymentProvider {
  async process(request: ProcessPaymentRequest): Promise<PaymentResult> {
    return {
      success: true,
      message: `Cash payment of ${request.amountPiasters} piasters processed`,
    };
  }

  async refund(request: RefundPaymentRequest): Promise<RefundResult> {
    return {
      success: true,
      message: `Cash refund of ${request.amountPiasters} piasters processed`,
    };
  }

  async getStatus(_transactionId: string): Promise<ProviderStatus> {
    return { status: 'completed' };
  }
}
