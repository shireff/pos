import { NextRequest, NextResponse } from 'next/server';
import { AuthenticateUser } from '@packages/application-identity';
import { handleApiError, ValidationError } from '../../../../lib/errors';
import { JwtTokenIssuer } from '../../../../lib/token';
import { ScryptPasswordHasher } from '../../../../lib/password';
import { User } from '@packages/domain-identity';
import { Device } from '@packages/domain-identity';

class InMemoryUserRepository {
  private readonly _users: User[] = [];

  public constructor() {
    // Demo user — replace with MongoDB repository in production.
    // Credentials: demo@smartretail.local / password123
    // passwordHash must be generated via ScryptPasswordHasher.hash() at setup time.
    this._users.push(
      User.create({
        companyId: 'company-demo',
        name: 'Demo User',
        phone: '0000000000',
        email: 'demo@smartretail.local',
        passwordHash: 'demo-placeholder',
        offlinePinHash: null,
        isActive: true,
        defaultBranchId: null,
      }),
    );
  }

  public async findByEmail(email: string, companyId: string): Promise<User | null> {
    return this._users.find((u) => u.email === email && u.companyId === companyId) ?? null;
  }
  public async findById(id: string, companyId: string): Promise<User | null> {
    return this._users.find((u) => u.id === id && u.companyId === companyId) ?? null;
  }
  public async findByPhone(): Promise<User | null> {
    return null;
  }
  public async save(user: User): Promise<void> {
    const idx = this._users.findIndex((u) => u.id === user.id);
    if (idx >= 0) this._users[idx] = user;
  }
  public async findAll(): Promise<User[]> {
    return [...this._users];
  }
}

class InMemoryDeviceRepository {
  private readonly _devices: Device[] = [];
  public async findByFingerprint(fp: string, companyId: string): Promise<Device | null> {
    return (
      this._devices.find((d) => d.deviceFingerprint === fp && d.companyId === companyId) ?? null
    );
  }
  public async findById(id: string): Promise<Device | null> {
    return this._devices.find((d) => d.id === id) ?? null;
  }
  public async findByCompany(companyId: string): Promise<Device[]> {
    return this._devices.filter((d) => d.companyId === companyId);
  }
  public async save(device: Device): Promise<void> {
    const idx = this._devices.findIndex((d) => d.id === device.id);
    if (idx >= 0) this._devices[idx] = device;
    else this._devices.push(device);
  }
}

const useCase = new AuthenticateUser(
  new InMemoryUserRepository(),
  new InMemoryDeviceRepository(),
  new ScryptPasswordHasher(),
  new JwtTokenIssuer(),
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
