import { IPaymentProvider, PaymentResult, RefundResult, ProviderStatus, ProcessPaymentRequest, RefundPaymentRequest } from '@packages/domain-sales';

export class EtisalatCashProvider implements IPaymentProvider {
  async process(request: ProcessPaymentRequest): Promise<PaymentResult> {
    return {
      success: true,
      externalReference: `ETI-${Date.now()}`,
      message: `Etisalat Cash payment of ${request.amountPiasters} piasters processed`,
    };
  }

  async refund(request: RefundPaymentRequest): Promise<RefundResult> {
    return {
      success: true,
      externalReference: request.providerReference,
      message: `Etisalat Cash refund of ${request.amountPiasters} piasters processed`,
    };
  }

  async getStatus(_transactionId: string): Promise<ProviderStatus> {
    return { status: 'completed' };
  }
}
