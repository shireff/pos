import { z } from 'zod';

export const CreatePurchaseOrderLineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional().nullable(),
  unitId: z.string().min(1),
  orderedQuantity: z.number().int().positive(),
  unitPricePiasters: z.number().int().nonnegative(),
});

export const CreatePurchaseOrderSchema = z.object({
  companyId: z.string().min(1),
  branchId: z.string().min(1),
  supplierId: z.string().min(1),
  expectedDeliveryDate: z.string().min(1),
  requestedByUserId: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
  autoApproveThresholdPiasters: z.number().int().nonnegative().optional(),
  lines: z.array(CreatePurchaseOrderLineSchema).min(1),
});

export const UpdatePurchaseOrderSchema = z
  .object({
    expectedDeliveryDate: z.string().min(1).optional(),
    notes: z.string().optional().nullable(),
    lines: z
      .array(
        z.object({
          id: z.string().min(1),
          orderedQuantity: z.number().int().positive(),
          unitPricePiasters: z.number().int().nonnegative(),
        }),
      )
      .optional(),
  })
  .refine((d) => d.expectedDeliveryDate !== undefined || d.notes !== undefined || d.lines !== undefined, {
    message: 'At least one field must be provided for update',
  });

export const ReceiveGoodsSchema = z.object({
  receivedByUserId: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
  lines: z.array(
    z.object({
      lineId: z.string().min(1),
      warehouseId: z.string().min(1),
      receivedQuantity: z.number().int().nonnegative(),
      discrepancyType: z
        .enum(['quantity_shortage', 'quality_rejection', 'wrong_item'])
        .optional()
        .nullable(),
      discrepancyNotes: z.string().optional().nullable(),
    }),
  ).min(1),
});

export const RejectPurchaseOrderSchema = z.object({
  reason: z.string().min(10),
});

export const CancelPurchaseOrderSchema = z.object({
  reason: z.string().min(1),
});

export const RecordSupplierInvoiceSchema = z.object({
  supplierId: z.string().min(1),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().min(1),
  totalAmountPiasters: z.number().int().positive(),
  taxAmountPiasters: z.number().int().nonnegative(),
  attachmentUrl: z.string().optional().nullable(),
});
