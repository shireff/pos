import { z } from 'zod';

export const CreateCouponSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9]+$/),
  discountType: z.enum(['percentage', 'fixed']),
  amount: z.number().int().positive(),
  isMultiUse: z.boolean().default(false),
  usageLimit: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().optional().nullable(),
  scopeType: z.enum(['global', 'product', 'category']),
  scopeIds: z.array(z.string().min(1)).min(1),
});

export const ValidateCouponSchema = z.object({
  code: z.string().min(1),
  cartTotalPiasters: z.number().int().nonnegative(),
  customerId: z.string().optional().nullable(),
  lineItems: z.array(z.object({
    productId: z.string().min(1),
    categoryId: z.string().optional().nullable(),
    productVariantId: z.string().min(1),
  })).optional(),
});
