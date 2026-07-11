import { IPaymentProvider, PaymentResult, RefundResult, ProviderStatus, ProcessPaymentRequest, RefundPaymentRequest } from '@packages/domain-sales';

export class InstaPayProvider implements IPaymentProvider {
  async process(request: ProcessPaymentRequest): Promise<PaymentResult> {
    return {
      success: true,
      externalReference: request.providerReference ?? `INSTA-${Date.now()}`,
      message: `InstaPay payment of ${request.amountPiasters} piasters processed`,
    };
  }

  async refund(request: RefundPaymentRequest): Promise<RefundResult> {
    return {
      success: true,
      externalReference: request.providerReference,
      message: `InstaPay refund of ${request.amountPiasters} piasters processed`,
    };
  }

  async getStatus(_transactionId: string): Promise<ProviderStatus> {
    return { status: 'completed' };
  }
}
