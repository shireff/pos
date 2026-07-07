import { User, Device } from '@packages/domain-identity';
import type { PasswordHasher, TokenIssuer, UserRepository, DeviceRepository } from '../ports';

export interface AuthenticateUserInput {
  email: string;
  password: string;
  companyId: string;
  deviceFingerprint: string;
  deviceType: 'desktop' | 'android';
}

export interface AuthenticateUserOutput {
  accessToken: string;
  refreshToken: string;
  user: User;
  device: Device;
}

export class AuthenticateUser {
  public constructor(
    private readonly users: UserRepository,
    private readonly devices: DeviceRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  public async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    const user = await this.users.findByEmail(input.email, input.companyId);
    if (!user || !user.isActive || user.isDeleted) {
      throw new Error('Invalid credentials');
    }

    const passwordMatches = await this.passwordHasher.verify(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new Error('Invalid credentials');
    }

    let device = await this.devices.findByFingerprint(input.deviceFingerprint, input.companyId);
    if (!device) {
      device = Device.register({
        companyId: input.companyId,
        deviceType: input.deviceType,
        deviceFingerprint: input.deviceFingerprint,
        registeredAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      });
      await this.devices.save(device);
    } else {
      device.updateLastSeen(new Date().toISOString());
      await this.devices.save(device);
    }

    const accessToken = this.tokenIssuer.issueAccessToken({
      userId: user.id,
      companyId: user.companyId,
      branchRoles: [],
    });
    const refreshToken = this.tokenIssuer.issueRefreshToken();

    return {
      accessToken,
      refreshToken,
      user,
      device,
    };
  }
}
