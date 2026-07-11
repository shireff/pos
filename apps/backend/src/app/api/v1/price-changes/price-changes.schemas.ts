import { z } from 'zod';

export const RequestPriceChangeSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  oldPricePiasters: z.number().int().nonnegative(),
  newPricePiasters: z.number().int().positive(),
  notes: z.string().optional().nullable(),
  autoApproveThresholdPiasters: z.number().int().nonnegative().default(0),
});

export const ApprovePriceChangeSchema = z.object({
  id: z.string().min(1),
});

export const RejectPriceChangeSchema = z.object({
  id: z.string().min(1),
});
