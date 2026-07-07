import { NextRequest, NextResponse } from 'next/server';
import { PlatformAdminMfaVerify } from '@packages/application-identity';
import { ValidationError, handleApiError } from '../../../../../lib/errors';
import { MfaVerifySchema } from '@packages/shared-kernel';
import { PlatformAdminUser } from '@packages/domain-platform-admin';

const adminByEmail = async (): Promise<PlatformAdminUser | null> => {
  return PlatformAdminUser.create({
    name: 'Admin User',
    email: 'admin@smartretail.local',
    passwordHash: 'hashed-password',
    role: 'super_admin',
    mfaSecret: 'JBSWY3DPEBLW64TMMQ======', // demo TOTP secret
    isMfaEnrolled: true,
    isActive: true,
  });
};

const useCase = new PlatformAdminMfaVerify(
  adminByEmail,
  async (secret, code) => code === '123456',
  (payload) => `demo-platform-admin.${payload.adminId}.token`,
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
