import { IPaymentProvider, PaymentResult, RefundResult, ProviderStatus, ProcessPaymentRequest, RefundPaymentRequest } from '@packages/domain-sales';

export class StoreCreditProvider implements IPaymentProvider {
  async process(request: ProcessPaymentRequest): Promise<PaymentResult> {
    return {
      success: true,
      message: `Store credit payment of ${request.amountPiasters} piasters processed`,
    };
  }

  async refund(request: RefundPaymentRequest): Promise<RefundResult> {
    return {
      success: true,
      message: `Store credit refund of ${request.amountPiasters} piasters processed`,
    };
  }

  async getStatus(_transactionId: string): Promise<ProviderStatus> {
    return { status: 'completed' };
  }
}
