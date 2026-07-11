import { IPaymentProvider, PaymentResult, RefundResult, ProviderStatus, ProcessPaymentRequest, RefundPaymentRequest } from '@packages/domain-sales';

export class BankTransferProvider implements IPaymentProvider {
  async process(request: ProcessPaymentRequest): Promise<PaymentResult> {
    if (!request.providerReference) {
      return {
        success: false,
        message: 'Bank transfer requires a reference number',
      };
    }
    return {
      success: true,
      externalReference: request.providerReference,
      message: `Bank transfer of ${request.amountPiasters} piasters recorded (pending verification)`,
    };
  }

  async refund(request: RefundPaymentRequest): Promise<RefundResult> {
    return {
      success: true,
      externalReference: request.providerReference,
      message: `Bank transfer reversal of ${request.amountPiasters} piasters recorded`,
    };
  }

  async getStatus(_transactionId: string): Promise<ProviderStatus> {
    return { status: 'pending' };
  }
}
