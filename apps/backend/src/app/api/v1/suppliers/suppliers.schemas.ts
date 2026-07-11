import { z } from 'zod';

export const SupplierNameSchema = z.object({
  ar: z.string().min(1, 'Arabic name is required'),
  en: z.string().optional(),
});

export const CreateSupplierSchema = z.object({
  name: SupplierNameSchema,
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  paymentTermsDays: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  contacts: z
    .array(
      z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        email: z.string().email().optional().nullable(),
        role: z.string().optional().nullable(),
      }),
    )
    .optional(),
});

export const UpdateSupplierSchema = z.object({
  name: SupplierNameSchema.optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  paymentTermsDays: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  contacts: z
    .array(
      z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        email: z.string().email().optional().nullable(),
        role: z.string().optional().nullable(),
      }),
    )
    .optional(),
});

export const RecordSupplierPaymentSchema = z.object({
  amountPiasters: z.number().int().positive('Amount must be positive'),
  paymentMethod: z.string().min(1),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const ApplySupplierCreditNoteSchema = z.object({
  amountPiasters: z.number().int().positive('Amount must be positive'),
  referenceNumber: z.string().optional().nullable(),
  reason: z.string().min(1, 'Reason is required'),
});

export const SearchSuppliersSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
export type RecordSupplierPaymentInput = z.infer<typeof RecordSupplierPaymentSchema>;
export type ApplySupplierCreditNoteInput = z.infer<typeof ApplySupplierCreditNoteSchema>;
export type SearchSuppliersInput = z.infer<typeof SearchSuppliersSchema>;
