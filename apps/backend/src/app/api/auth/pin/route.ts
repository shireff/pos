import { NextRequest, NextResponse } from 'next/server';
import { OfflinePinLogin, SetOfflinePin } from '@packages/application-identity';
import { User, Device } from '@packages/domain-identity';
import { getAuthContext } from '../../../../lib/auth';
import { handleApiError, ValidationError } from '../../../../lib/errors';

class InMemoryUserRepository {
  private readonly users: User[] = [
    User.create({
      companyId: 'company-demo',
      name: 'Demo User',
      phone: '0000000000',
      email: 'demo@smartretail.local',
      passwordHash: 'hashed-password',
      offlinePinHash: 'hashed-1234',
      isActive: true,
      defaultBranchId: null,
    }),
  ];
  async findById(id: string, companyId: string): Promise<User | null> {
    return this.users.find((u) => u.id === id && u.companyId === companyId) ?? null;
  }
  async findByEmail(email: string, companyId: string): Promise<User | null> {
    return this.users.find((u) => u.email === email && u.companyId === companyId) ?? null;
  }
  async findByPhone(): Promise<User | null> {
    return null;
  }
  async findAll(): Promise<User[]> {
    return [];
  }
  async save(user: User): Promise<void> {
    const idx = this.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) this.users[idx] = user;
  }
}

class InMemoryDeviceRepository {
  private readonly devices: Device[] = [];
  async findByFingerprint(fp: string, companyId: string): Promise<Device | null> {
    return (
      this.devices.find((d) => d.deviceFingerprint === fp && d.companyId === companyId) ?? null
    );
  }
  async findById(): Promise<Device | null> {
    return null;
  }
  async findByCompany(): Promise<Device[]> {
    return [];
  }
  async save(device: Device): Promise<void> {
    const idx = this.devices.findIndex((d) => d.id === device.id);
    if (idx >= 0) this.devices[idx] = device;
    else this.devices.push(device);
  }
}

class DemoPasswordHasher {
  async verify(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed-${plain}`;
  }
  async hash(plain: string): Promise<string> {
    return `hashed-${plain}`;
  }
}

class DemoTokenIssuer {
  issueAccessToken(payload: { userId: string; companyId: string; branchRoles: string[] }): string {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 900 }),
    ).toString('base64url');
    return `${header}.${body}.signature`;
  }
  issueRefreshToken(): string {
    return 'refresh-token';
  }
  hashToken(t: string): string {
    return t;
  }
  verifyAccessToken(
    token: string,
  ): { userId: string; companyId: string; branchRoles: string[] } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
        userId: string;
        companyId: string;
        branchRoles: string[];
      };
    } catch {
      return null;
    }
  }
}

const userRepo = new InMemoryUserRepository();
const deviceRepo = new InMemoryDeviceRepository();
const hasher = new DemoPasswordHasher();
const tokenIssuer = new DemoTokenIssuer();

/** POST /api/auth/pin — offline PIN login (no network required after initial setup) */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      userId?: string;
      companyId?: string;
      pin?: string;
      deviceFingerprint?: string;
      deviceType?: 'desktop' | 'android';
    };

    if (
      !body.userId ||
      !body.companyId ||
      !body.pin ||
      !body.deviceFingerprint ||
      !body.deviceType
    ) {
      throw new ValidationError(
        'userId, companyId, pin, deviceFingerprint, and deviceType are required',
      );
    }

    const result = await new OfflinePinLogin(userRepo, deviceRepo, hasher, tokenIssuer).execute({
      companyId: body.companyId,
      userId: body.userId,
      pin: body.pin,
      deviceFingerprint: body.deviceFingerprint,
      deviceType: body.deviceType,
    });

    return NextResponse.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        isOffline: result.isOffline,
        user: { id: result.user.id, companyId: result.user.companyId, name: result.user.name },
        device: { id: result.device.id, deviceFingerprint: result.device.deviceFingerprint },
      },
    });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}

/** PUT /api/auth/pin — set/update offline PIN (requires valid online Bearer token) */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const context = getAuthContext(request);
    const body = (await request.json()) as { pin?: string };
    if (!body.pin) throw new ValidationError('pin is required');

    await new SetOfflinePin(userRepo, hasher).execute({
      companyId: context.companyId,
      userId: context.userId,
      pin: body.pin,
    });

    return NextResponse.json({ success: true, data: { updated: true } });
  } catch (error) {
    return handleApiError(error as unknown, request);
  }
}
