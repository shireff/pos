import { z } from 'zod';
import { t } from '../../../../lib/i18n';

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, t('validation.nameRequired')),
  phone: z.string().min(1, t('validation.phoneRequired')),
  email: z.string().email(t('validation.email')).optional().nullable(),
  creditLimitPiasters: z.number().int().nonnegative(t('validation.creditLimitNonNegative')).optional(),
  notes: z.string().optional().nullable(),
});

export const UpdateCustomerSchema = z.object({
  name: z.string().min(1, t('validation.nameRequired')).optional(),
  phone: z.string().min(1, t('validation.phoneRequired')).optional(),
  email: z.string().email(t('validation.email')).optional().nullable(),
  creditLimitPiasters: z.number().int().nonnegative(t('validation.creditLimitNonNegative')).optional(),
  notes: z.string().optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: t('validation.atLeastOneField'),
});

export const MergeCustomersSchema = z.object({
  sourceId: z.string().uuid(t('validation.invalidUuid', { field: 'sourceId' })),
  targetId: z.string().uuid(t('validation.invalidUuid', { field: 'targetId' })),
}).refine((data) => data.sourceId !== data.targetId, {
  message: t('validation.sourceTargetDiffer'),
  path: ['targetId'],
});

export const RedeemLoyaltySchema = z.object({
  points: z.number().int().positive(t('validation.pointsPositive')),
  orderId: z.string().uuid(t('validation.invalidUuid', { field: 'orderId' })).optional().nullable(),
});

export const RecordCreditPaymentSchema = z.object({
  amountPiasters: z.number().int().positive(t('validation.amountPositive')),
  paymentMethod: z.string().min(1, t('validation.paymentMethodRequired')),
  referenceNumber: z.string().optional().nullable(),
  referenceType: z.string().optional().nullable(),
  referenceId: z.string().uuid(t('validation.invalidUuid', { field: 'referenceId' })).optional().nullable(),
});

export const SearchCustomersSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});
