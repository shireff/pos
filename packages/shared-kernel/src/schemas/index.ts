import { z } from 'zod';

const UUIDv7Schema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Invalid UUIDv7 format',
  );
const LocalizedNameSchema = z.object({
  ar: z.string().min(1, 'Arabic name is required'),
  en: z.string().optional(),
});

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  companyCode: z.string().min(1, 'Company code is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  deviceFingerprint: z.string().min(1, 'Device fingerprint is required'),
  deviceType: z.enum(['desktop', 'android']),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const LogoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type LogoutInput = z.infer<typeof LogoutSchema>;

// ─── Device Schemas ──────────────────────────────────────────────────────────

export const RegisterDeviceSchema = z.object({
  deviceFingerprint: z.string().min(1, 'Device fingerprint is required'),
  deviceType: z.enum(['desktop', 'android']),
});
export type RegisterDeviceInput = z.infer<typeof RegisterDeviceSchema>;

export const RevokeDeviceSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});
export type RevokeDeviceInput = z.infer<typeof RevokeDeviceSchema>;

// ─── Subscription Schemas ────────────────────────────────────────────────────

export const UpgradeSubscriptionSchema = z.object({
  planId: z.enum(['basic', 'pro', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']),
});
export type UpgradeSubscriptionInput = z.infer<typeof UpgradeSubscriptionSchema>;

// ─── Platform Admin Auth Schemas ─────────────────────────────────────────────

export const PlatformAdminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type PlatformAdminLoginInput = z.infer<typeof PlatformAdminLoginSchema>;

export const MfaVerifySchema = z.object({
  mfaChallengeToken: z.string().min(1, 'MFA challenge token is required'),
  code: z.string().regex(/^\d{6}$/, 'MFA code must be 6 digits'),
});
export type MfaVerifyInput = z.infer<typeof MfaVerifySchema>;

export const MfaSetupSchema = z.object({
  email: z.string().email('Email must be valid'),
  password: z.string().min(1, 'Password is required'),
});
export type MfaSetupInput = z.infer<typeof MfaSetupSchema>;

export const MfaSetupVerifySchema = z.object({
  setupToken: z.string().min(1, 'MFA setup token is required'),
  code: z.string().regex(/^\d{6}$/, 'MFA code must be 6 digits'),
});
export type MfaSetupVerifyInput = z.infer<typeof MfaSetupVerifySchema>;

// ─── Platform Admin Tenant Management Schemas ────────────────────────────────

export const ChangePlanSchema = z.object({
  planId: z.enum(['basic', 'pro', 'enterprise']),
  reason: z.string().min(1, 'Reason is mandatory'),
});
export type ChangePlanInput = z.infer<typeof ChangePlanSchema>;

export const SuspendSchema = z.object({
  reason: z.string().min(1, 'Reason is mandatory'),
});
export type SuspendInput = z.infer<typeof SuspendSchema>;

export const ReactivateSchema = z.object({
  reason: z.string().min(1, 'Reason is mandatory'),
});
export type ReactivateInput = z.infer<typeof ReactivateSchema>;

export const ExtendTrialSchema = z.object({
  newTrialEndsAt: z.string().datetime('newTrialEndsAt must be a valid ISO date'),
  reason: z.string().min(1, 'Reason is mandatory'),
});
export type ExtendTrialInput = z.infer<typeof ExtendTrialSchema>;

// ─── Catalog Schemas ───────────────────────────────────────────────────────

export const CreateProductSchema = z.object({
  name: LocalizedNameSchema,
  sku: z.string().min(1, 'SKU is required'),
  categoryId: UUIDv7Schema.optional(),
  unitId: UUIDv7Schema.optional(),
  costPrice: z.number().int().positive('Cost price must be a positive integer'),
  sellingPrice: z.number().int().positive('Selling price must be a positive integer'),
  status: z.enum(['active', 'archived']).optional().default('active'),
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = z
  .object({
    name: LocalizedNameSchema.optional(),
    sku: z.string().min(1, 'SKU is required').optional(),
    categoryId: UUIDv7Schema.optional(),
    unitId: UUIDv7Schema.optional(),
    costPrice: z.number().int().positive('Cost price must be a positive integer').optional(),
    sellingPrice: z.number().int().positive('Selling price must be a positive integer').optional(),
    status: z.enum(['active', 'archived']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export const AddVariantSchema = z.object({
  name: LocalizedNameSchema,
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().min(1, 'Barcode is required').optional(),
  additionalPrice: z.number().int().nonnegative('Additional price must be non-negative'),
  attributes: z.record(z.string(), z.string()),
});
export type AddVariantInput = z.infer<typeof AddVariantSchema>;

export const ConfigureBundleSchema = z.object({
  components: z
    .array(
      z.object({
        componentProductId: UUIDv7Schema,
        quantity: z.number().int().positive('Quantity must be a positive integer'),
        deductionRatio: z.number().min(0).max(1, 'Deduction ratio must be between 0 and 1'),
      }),
    )
    .min(1, 'At least one bundle component is required'),
});
export type ConfigureBundleInput = z.infer<typeof ConfigureBundleSchema>;

export const GenerateBarcodeSchema = z.object({
  variantId: UUIDv7Schema.optional(),
  barcodeType: z.enum(['EAN-13', 'Code128']).optional(),
});
export type GenerateBarcodeInput = z.infer<typeof GenerateBarcodeSchema>;

// ─── Category Schemas ─────────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  name: LocalizedNameSchema,
  parentId: UUIDv7Schema.optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
});
export type CreateCategorySchemaInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = z
  .object({
    companyId: z.string().min(1, 'Company ID is required').optional(),
    name: LocalizedNameSchema.optional(),
    sortOrder: z.number().int().nonnegative().optional(),
    // parentId intentionally excluded — use move endpoint for tree restructuring
  })
  .refine((data) => data.name !== undefined || data.sortOrder !== undefined, {
    message: 'At least one of name or sortOrder is required',
  });
export type UpdateCategorySchemaInput = z.infer<typeof UpdateCategorySchema>;

export const MoveCategorySchema = z.object({
  companyId: z.string().min(1, 'Company ID is required').optional(),
  newParentId: UUIDv7Schema.nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
});
export type MoveCategorySchemaInput = z.infer<typeof MoveCategorySchema>;

// ─── Unit Schemas ─────────────────────────────────────────────────────────────

export const CreateUnitSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  name: LocalizedNameSchema,
  abbreviation: z.string().min(1, 'Abbreviation is required').max(10, 'Abbreviation too long'),
  isBaseUnit: z.boolean(),
  conversionFactorToBase: z.number().positive('conversionFactorToBase must be positive'),
});
export type CreateUnitSchemaInput = z.infer<typeof CreateUnitSchema>;

export const UpdateUnitSchema = z
  .object({
    companyId: z.string().min(1, 'Company ID is required').optional(),
    name: LocalizedNameSchema.optional(),
    abbreviation: z.string().min(1).max(10).optional(),
    conversionFactorToBase: z.number().positive().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.abbreviation !== undefined ||
      data.conversionFactorToBase !== undefined,
    { message: 'At least one field is required' },
  );
export type UpdateUnitSchemaInput = z.infer<typeof UpdateUnitSchema>;
