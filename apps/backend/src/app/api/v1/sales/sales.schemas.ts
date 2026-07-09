import { z } from 'zod';

const TenderTypeEnum = z.enum([
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

export const CreateSaleLineSchema = z.object({
  productVariantId: z.string().min(1),
  productId: z.string().min(1),
  batchId: z.string().min(1).optional().nullable(),
  isBundle: z.boolean().optional(),
  quantity: z.number().int().positive(),
  unitPricePiasters: z.number().int().nonnegative(),
  discountAmountPiasters: z.number().int().nonnegative().optional(),
  taxAmountPiasters: z.number().int().nonnegative().optional(),
  costSnapshotPiasters: z.number().int().nonnegative().optional(),
});

export const CreateSalePaymentSchema = z.object({
  tenderType: TenderTypeEnum,
  amountPiasters: z.number().int().positive(),
  providerReference: z.string().min(1).optional().nullable(),
});

export const CreateSaleSchema = z.object({
  companyId: z.string().min(1).optional(),
  branchId: z.string().min(1),
  cashierId: z.string().min(1).optional(),
  warehouseId: z.string().min(1).optional(),
  clientTxnId: z.string().min(1),
  customerId: z.string().min(1).optional().nullable(),
  shiftSessionId: z.string().min(1).optional().nullable(),
  discountRuleIds: z.array(z.string().min(1)).optional(),
  couponCode: z.string().min(1).optional().nullable(),
  lines: z.array(CreateSaleLineSchema).min(1),
  payments: z.array(CreateSalePaymentSchema).min(1),
});

export const ProcessReturnLineSchema = z.object({
  orderLineId: z.string().min(1),
  productVariantId: z.string().min(1),
  productId: z.string().min(1),
  batchId: z.string().min(1).optional().nullable(),
  returnQuantity: z.number().int().positive(),
  refundAmountPiasters: z.number().int().nonnegative(),
});

export const ProcessReturnSchema = z.object({
  returnedByUserId: z.string().min(1).optional(),
  reason: z.string().min(5),
  warehouseId: z.string().min(1).optional(),
  refundMethod: TenderTypeEnum.or(z.literal('store_credit')).optional(),
  refundApprovalThresholdPiasters: z.number().int().nonnegative().optional(),
  lines: z.array(ProcessReturnLineSchema).min(1),
});

export const VoidSaleSchema = z.object({
  voidedByUserId: z.string().min(1).optional(),
  reason: z.string().min(5),
  currentShiftSessionId: z.string().min(1).optional().nullable(),
  warehouseId: z.string().min(1).optional(),
});

export const OpenShiftSchema = z.object({
  companyId: z.string().min(1).optional(),
  branchId: z.string().min(1),
  cashierId: z.string().min(1).optional(),
  openingCashPiasters: z.number().int().nonnegative(),
});

export const CloseShiftSchema = z.object({
  shiftSessionId: z.string().min(1),
  closingCashPiasters: z.number().int().nonnegative(),
});

export const OpenDrawerSchema = z.object({
  companyId: z.string().min(1).optional(),
  branchId: z.string().min(1),
  cashierId: z.string().min(1).optional(),
});
