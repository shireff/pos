import { z } from 'zod';

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  creditLimitPiasters: z.number().int().nonnegative('Credit limit must be non-negative').optional(),
  notes: z.string().optional().nullable(),
});

export const UpdateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().min(1, 'Phone is required').optional(),
  email: z.string().email('Invalid email address').optional().nullable(),
  creditLimitPiasters: z.number().int().nonnegative('Credit limit must be non-negative').optional(),
  notes: z.string().optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const MergeCustomersSchema = z.object({
  sourceId: z.string().uuid('sourceId must be a valid UUID'),
  targetId: z.string().uuid('targetId must be a valid UUID'),
}).refine((data) => data.sourceId !== data.targetId, {
  message: 'Source and target customers must differ',
  path: ['targetId'],
});

export const RedeemLoyaltySchema = z.object({
  points: z.number().int().positive('Points must be a positive integer'),
  orderId: z.string().uuid('orderId must be a valid UUID').optional().nullable(),
});

export const RecordCreditPaymentSchema = z.object({
  amountPiasters: z.number().int().positive('Amount must be a positive integer'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  referenceNumber: z.string().optional().nullable(),
  referenceType: z.string().optional().nullable(),
  referenceId: z.string().uuid('referenceId must be a valid UUID').optional().nullable(),
});

export const SearchCustomersSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});
