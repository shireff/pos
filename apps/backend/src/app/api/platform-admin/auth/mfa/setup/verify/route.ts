import { NextRequest, NextResponse } from 'next/server';
import { PlatformAdminMfaSetupVerify } from '@packages/application-identity';
import { ValidationError, handleApiError } from '../../../../../../../lib/errors';
import { MfaSetupVerifySchema } from '@packages/shared-kernel';
import { PlatformAdminUser } from '@packages/domain-platform-admin';
import { getMongoDb } from '../../../../../../../lib/cloud-db';
import { verifyTotp } from '../../../../../../../lib/totp';

const adminById = async (adminId: string): Promise<PlatformAdminUser | null> => {
  const db = await getMongoDb();
  const doc = await db
    .collection<any>('platform_admins')
    .findOne({ _id: adminId, is_active: true });
  if (!doc) return null;

  return PlatformAdminUser.reconstitute({
    id: String(doc._id),
    name: doc.name ?? doc.email.split('@')[0],
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

const enrollMfa = async (id: string, _secret: string): Promise<void> => {
  const db = await getMongoDb();
  await db
    .collection<any>('platform_admins')
    .updateOne({ _id: id }, { $set: { is_mfa_enrolled: true, updated_at: new Date() } });
};

const useCase = new PlatformAdminMfaSetupVerify(
  adminById,
  async (secret, code) => verifyTotp(secret, code),
  enrollMfa,
);

/**
 * Step 2 — confirm MFA enrollment by verifying the TOTP code the admin sees in
 * their Authenticator app, then mark the admin as enrolled.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = MfaSetupVerifySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(`Invalid request: ${parsed.error.message}`);
    }

    const result = await useCase.execute(parsed.data);

    return NextResponse.json(
      {
        success: true,
        data: { adminId: result.adminId, enrolled: true },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}
