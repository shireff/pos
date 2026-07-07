import { NextRequest, NextResponse } from 'next/server';
import { AuthenticateUser } from '@packages/application-identity';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import { User } from '@packages/domain-identity';
import { Device } from '@packages/domain-identity';

class InMemoryUserRepository {
  public async findByEmail(email: string, companyId: string): Promise<User | null> {
    if (email === 'demo@smartretail.local' && companyId === 'company-demo') {
      return User.create({
        companyId,
        name: 'Demo User',
        phone: '0000000000',
        email,
        passwordHash: 'hashed-password',
        offlinePinHash: null,
        isActive: true,
        defaultBranchId: null,
      });
    }
    return null;
  }

  public async findById(): Promise<User | null> {
    return null;
  }
  public async findByPhone(): Promise<User | null> {
    return null;
  }
  public async save(): Promise<void> {}
  public async findAll(): Promise<User[]> {
    return [];
  }
}

class InMemoryDeviceRepository {
  public async findByFingerprint(): Promise<Device | null> {
    return null;
  }
  public async findById(): Promise<Device | null> {
    return null;
  }
  public async findByCompany(): Promise<Device[]> {
    return [];
  }
  public async save(): Promise<void> {}
}

class DemoPasswordHasher {
  public async verify(plaintext: string, hash: string): Promise<boolean> {
    return plaintext === 'password123' && hash === 'hashed-password';
  }

  public async hash(): Promise<string> {
    return 'hashed-password';
  }
}

class DemoTokenIssuer {
  public issueAccessToken(payload: {
    userId: string;
    companyId: string;
    branchRoles: string[];
  }): string {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 900 }),
    ).toString('base64url');
    return `${header}.${body}.signature`;
  }

  public issueRefreshToken(): string {
    return 'refresh-token';
  }

  public hashToken(token: string): string {
    return token;
  }

  public verifyAccessToken(
    token: string,
  ): { userId: string; companyId: string; branchRoles: string[] } | null {
    if (!token.startsWith('ey')) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
        userId: string;
        companyId: string;
        branchRoles: string[];
      };
      return payload;
    } catch {
      return null;
    }
  }
}

const useCase = new AuthenticateUser(
  new InMemoryUserRepository(),
  new InMemoryDeviceRepository(),
  new DemoPasswordHasher(),
  new DemoTokenIssuer(),
);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password, companyId, deviceFingerprint, deviceType } = body as {
      email?: string;
      password?: string;
      companyId?: string;
      deviceFingerprint?: string;
      deviceType?: 'desktop' | 'android';
    };

    if (!email || !password || !companyId || !deviceFingerprint || !deviceType) {
      throw new ValidationError(
        'email, password, companyId, deviceFingerprint, and deviceType are required',
      );
    }

    const result = await useCase.execute({
      email,
      password,
      companyId,
      deviceFingerprint,
      deviceType,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: {
            id: result.user.id,
            companyId: result.user.companyId,
            name: result.user.name,
            email: result.user.email,
          },
          device: {
            id: result.device.id,
            deviceFingerprint: result.device.deviceFingerprint,
            deviceType: result.device.deviceType,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}
