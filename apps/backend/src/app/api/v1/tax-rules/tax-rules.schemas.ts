import { z } from 'zod';

export const CreateTaxRuleSchema = z.object({
  name: z.string().min(1),
  rateBasisPoints: z.number().int().min(0).max(10000),
  appliesTo: z.enum(['all', 'category', 'product']),
  scopeIds: z.array(z.string().min(1)),
  priority: z.number().int().nonnegative().default(0),
});

export const GetApplicableTaxesSchema = z.object({
  productVariantIds: z.array(z.string().min(1)).min(1),
  categoryIds: z.array(z.string().optional().nullable()).min(1),
  subtotalPiasters: z.number().int().nonnegative(),
  mode: z.enum(['additive', 'compound']).optional(),
});
