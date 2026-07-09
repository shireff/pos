import { NextRequest, NextResponse } from 'next/server';
import { PlatformAdminMfaSetup } from '@packages/application-identity';
import { ValidationError, handleApiError } from '../../../../../../lib/errors';
import { MfaSetupSchema } from '@packages/shared-kernel';
import { PlatformAdminUser } from '@packages/domain-platform-admin';
import { getMongoDb } from '../../../../../../lib/cloud-db';
import { verifyPassword } from '../../../../../../lib/password';
import { generateTotpSecret, buildOtpAuthUri, generateQrDataUrl } from '../../../../../../lib/totp';

const ISSUER = 'SmartRetailOS';

const adminByEmailAndPassword = async (
  email: string,
  password: string,
): Promise<PlatformAdminUser | null> => {
  const db = await getMongoDb();
  const doc = await db.collection('platform_admins').findOne({ email, is_active: true });
  if (!doc) return null;
  if (!verifyPassword(password, doc.password_hash)) return null;

  return PlatformAdminUser.reconstitute({
    id: String(doc._id),
    name: doc.name ?? email.split('@')[0],
    email: doc.email,
    passwordHash: doc.password_hash,
    role: doc.role,
    mfaSecret: doc.mfa_secret,
    isMfaEnrolled: Boolean(doc.mfa_secret),
    isActive: doc.is_active,
    failedLoginAttempts: doc.failed_login_attempts ?? 0,
    lockedUntil: doc.locked_until ?? null,
    createdAt: doc.created_at ? new Date(doc.created_at).toISOString() : new Date().toISOString(),
    updatedAt: doc.updated_at ? new Date(doc.updated_at).toISOString() : new Date().toISOString(),
  });
};

const useCase = new PlatformAdminMfaSetup(adminByEmailAndPassword);

/**
 * Step 1 — MFA enrollment setup.
 * Authenticates the admin, generates a fresh TOTP secret (stored as pending),
 * and returns the secret + otpauth URI + QR code so the admin can scan it.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = MfaSetupSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(`Invalid request: ${parsed.error.message}`);
    }

    const { adminId, setupToken } = await useCase.execute(parsed.data);

    const secret = generateTotpSecret();
    // Persist as pending; enrollment is finalized by the verify step.
    const db = await getMongoDb();
    await db.collection<any>('platform_admins').updateOne(
      { _id: adminId },
      { $set: { mfa_secret: secret, is_mfa_enrolled: false, updated_at: new Date() } },
    );

    const otpauthUri = buildOtpAuthUri({
      issuer: ISSUER,
      account: parsed.data.email,
      secret,
    });
    const qrCode = await generateQrDataUrl(otpauthUri);

    return NextResponse.json(
      {
        success: true,
        data: { secret, otpauthUri, qrCode, setupToken },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}
