import { User, Device } from '@packages/domain-identity';
import type { PasswordHasher, TokenIssuer, UserRepository, DeviceRepository } from '../ports';

/**
 * OfflinePinLogin — authenticates a user using their locally stored PIN hash.
 * Used when the device has no network connectivity.
 * The PIN hash is set during online session via SetOfflinePin use case.
 *
 * Security: PIN hash comparison delegates to PasswordHasher (bcrypt/argon2).
 * Device must be pre-registered online before offline PIN can be used.
 */
export interface OfflinePinLoginInput {
  companyId: string;
  userId: string;
  pin: string;
  deviceFingerprint: string;
  deviceType: 'desktop' | 'android';
}

export interface OfflinePinLoginOutput {
  accessToken: string;
  user: User;
  device: Device;
  isOffline: true;
}

export class OfflinePinLogin {
  public constructor(
    private readonly users: UserRepository,
    private readonly devices: DeviceRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  public async execute(input: OfflinePinLoginInput): Promise<OfflinePinLoginOutput> {
    const user = await this.users.findById(input.userId, input.companyId);
    if (!user || !user.isActive || user.isDeleted) {
      throw new Error('User not found or inactive');
    }

    if (!user.offlinePinHash) {
      throw new Error('Offline PIN not set. Please login online first to configure your PIN.');
    }

    const pinMatches = await this.passwordHasher.verify(input.pin, user.offlinePinHash);
    if (!pinMatches) {
      throw new Error('Invalid PIN');
    }

    const device = await this.devices.findByFingerprint(input.deviceFingerprint, input.companyId);
    if (!device) {
      throw new Error(
        'Device not registered. Connect online to register this device before using offline PIN.',
      );
    }
    if (device.isRevoked) {
      throw new Error('Device has been revoked');
    }

    device.updateLastSeen(new Date().toISOString());
    await this.devices.save(device);

    const accessToken = this.tokenIssuer.issueAccessToken({
      userId: user.id,
      companyId: user.companyId,
      branchRoles: [],
    });

    return { accessToken, user, device, isOffline: true };
  }
}

// ─── SetOfflinePin use case ───────────────────────────────────────────────────

export interface SetOfflinePinInput {
  companyId: string;
  userId: string;
  pin: string;
}

export interface SetOfflinePinOutput {
  updated: true;
}

export class SetOfflinePin {
  public constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  public async execute(input: SetOfflinePinInput): Promise<SetOfflinePinOutput> {
    if (!/^\d{4,8}$/.test(input.pin)) {
      throw new Error('PIN must be 4 to 8 digits');
    }

    const user = await this.users.findById(input.userId, input.companyId);
    if (!user || !user.isActive || user.isDeleted) {
      throw new Error('User not found or inactive');
    }

    const pinHash = await this.passwordHasher.hash(input.pin);
    user.setOfflinePinHash(pinHash);
    await this.users.save(user);

    return { updated: true };
  }
}
