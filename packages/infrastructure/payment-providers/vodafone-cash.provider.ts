import { IPaymentProvider, PaymentResult, RefundResult, ProviderStatus, ProcessPaymentRequest, RefundPaymentRequest } from '@packages/domain-sales';

export class VodafoneCashProvider implements IPaymentProvider {
  async process(request: ProcessPaymentRequest): Promise<PaymentResult> {
    return {
      success: true,
      externalReference: `VFC-${Date.now()}`,
      message: `Vodafone Cash payment of ${request.amountPiasters} piasters processed`,
    };
  }

  async refund(request: RefundPaymentRequest): Promise<RefundResult> {
    return {
      success: true,
      externalReference: request.providerReference,
      message: `Vodafone Cash refund of ${request.amountPiasters} piasters processed`,
    };
  }

  async getStatus(_transactionId: string): Promise<ProviderStatus> {
    return { status: 'completed' };
  }
}
