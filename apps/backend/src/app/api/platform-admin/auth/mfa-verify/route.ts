import { NextRequest, NextResponse } from 'next/server';
import { PlatformAdminMfaVerify } from '@packages/application-identity';
import { ValidationError, handleApiError } from '../../../../../lib/errors';
import { MfaVerifySchema } from '@packages/shared-kernel';
import { PlatformAdminUser } from '@packages/domain-platform-admin';
import { getMongoDb } from '../../../../../lib/cloud-db';
import jwt from 'jsonwebtoken';
import { verifyTotp } from '../../../../../lib/totp';

const JWT_SECRET =
  process.env.PLATFORM_ADMIN_JWT_SECRET ?? 'dev-platform-admin-secret-change-in-prod';

const adminById = async (adminId: string): Promise<PlatformAdminUser | null> => {
  const db = await getMongoDb();
  // adminId is the document _id stored in platform_admins
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

const issueAdminAccessToken = (payload: { adminId: string }): string => {
  return jwt.sign(
    {
      sub: payload.adminId,
      role: 'platform_admin',
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: '8h' },
  );
};

const useCase = new PlatformAdminMfaVerify(
  adminById,
  async (secret, code) => verifyTotp(secret, code),
  issueAdminAccessToken,
);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = MfaVerifySchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(`Invalid request: ${parsed.error.message}`);
    }

    const result = await useCase.execute(parsed.data);

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken: result.adminAccessToken,
          admin: {
            id: result.admin.id,
            name: result.admin.name,
            email: result.admin.email,
            role: result.admin.role,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}
