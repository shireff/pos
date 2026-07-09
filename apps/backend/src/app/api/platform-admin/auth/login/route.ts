import { NextRequest, NextResponse } from 'next/server';
import { PlatformAdminLogin } from '@packages/application-identity';
import { ValidationError, UnauthorizedError, handleApiError } from '../../../../../lib/errors';
import { PlatformAdminLoginSchema } from '@packages/shared-kernel';
import { PlatformAdminUser } from '@packages/domain-platform-admin';
import { getMongoDb } from '../../../../../lib/cloud-db';
import { verifyPassword } from '../../../../../lib/password';

// Cache: lookup admin + verify password before invoking the use-case
const adminByEmailWithAuth = async (
  email: string,
  password: string,
): Promise<PlatformAdminUser | null> => {
  const db = await getMongoDb();
  const doc = await db.collection('platform_admins').findOne({ email, is_active: true });
  if (!doc) return null;

  // Verify password against stored scrypt hash
  const valid = verifyPassword(password, doc.password_hash);
  if (!valid) return null; // treat as "not found" to prevent user-enumeration

  // Reconstitute with the document's real _id so the challenge token maps back
  // to an actual record (PlatformAdminUser.create() would mint a fresh id).
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = PlatformAdminLoginSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(`Invalid request: ${parsed.error.message}`);
    }

    // Perform password verification before the use-case so the domain layer
    // never sees the raw password.
    const adminDoc = await adminByEmailWithAuth(parsed.data.email, parsed.data.password);
    if (!adminDoc) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Wrap in a closure so PlatformAdminLogin only receives the already-verified admin
    const useCase = new PlatformAdminLogin(async (_email: string) => adminDoc);
    const result = await useCase.execute(parsed.data);

    return NextResponse.json(
      {
        success: true,
        data: {
          challengeToken: result.challengeToken,
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
