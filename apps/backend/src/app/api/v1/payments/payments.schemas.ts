import { z } from 'zod';

export const TenderTypeEnum = z.enum([
  'cash',
  'card',
  'vodafone_cash',
  'orange_cash',
  'etisalat_cash',
  'we_pay',
  'instapay',
  'bank_transfer',
  'customer_credit',
  'store_credit',
]);

export const ProcessPaymentSchema = z.object({
  orderId: z.string().min(1),
  tenders: z.array(
    z.object({
      tenderType: TenderTypeEnum,
      amountPiasters: z.number().int().positive(),
      providerReference: z.string().min(1).optional().nullable(),
    }),
  ).min(1),
});

export const RefundPaymentSchema = z.object({
  transactionId: z.string().min(1),
  amountPiasters: z.number().int().positive(),
  reason: z.string().min(1).optional().nullable(),
});

export const PaymentMethodSchema = z.object({
  companyId: z.string().min(1).optional(),
});
