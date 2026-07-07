import { NextRequest, NextResponse } from 'next/server';
import { PlatformAdminLogin } from '@packages/application-identity';
import { ValidationError, handleApiError } from '../../../../../lib/errors';
import { PlatformAdminLoginSchema } from '@packages/shared-kernel';
import { PlatformAdminUser } from '@packages/domain-platform-admin';

const adminByEmail = async (email: string): Promise<PlatformAdminUser | null> => {
  if (email === 'admin@smartretail.local') {
    return PlatformAdminUser.create({
      name: 'Admin User',
      email,
      passwordHash: 'hashed-password',
      role: 'super_admin',
      mfaSecret: 'JBSWY3DPEBLW64TMMQ======', // demo TOTP secret
      isMfaEnrolled: true,
      isActive: true,
    });
  }
  return null;
};

const useCase = new PlatformAdminLogin(adminByEmail);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = PlatformAdminLoginSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(`Invalid request: ${parsed.error.message}`);
    }

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
