import { describe, it, expect, vi } from 'vitest';
import { AuthenticateUser } from './authenticate-user';
import { User } from '@packages/domain-identity';
import type { DeviceRepository, PasswordHasher, TokenIssuer, UserRepository } from '../ports';

const makeUser = () =>
  User.create({
    companyId: 'company-1',
    name: 'Ada',
    phone: '123',
    email: 'ada@example.com',
    passwordHash: 'hashed',
    isActive: true,
    defaultBranchId: null,
  });

describe('AuthenticateUser', () => {
  it('returns tokens and registers a device on successful login', async () => {
    const user = makeUser();
    // const device = Device.register({
    //   companyId: 'company-1',
    //   deviceType: 'desktop',
    //   deviceFingerprint: 'fp-1',
    //   registeredAt: new Date().toISOString(),
    //   lastSeenAt: new Date().toISOString(),
    // });

    const users = {
      findByEmail: vi.fn().mockResolvedValue(user),
    };
    const devicesRepo = {
      findByFingerprint: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const passwordHasher = {
      verify: vi.fn().mockResolvedValue(true),
    };
    const tokenIssuer = {
      issueAccessToken: vi.fn().mockReturnValue('access-token'),
      issueRefreshToken: vi.fn().mockReturnValue('refresh-token'),
    };

    const useCase = new AuthenticateUser(
      users as UserRepository,
      devicesRepo as DeviceRepository,
      passwordHasher as PasswordHasher,
      tokenIssuer as TokenIssuer,
    );

    const result = await useCase.execute({
      email: 'ada@example.com',
      companyId: 'company-1',
      password: 'secret',
      deviceFingerprint: 'fp-1',
      deviceType: 'desktop',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.id).toBe(user.id);
    expect(devicesRepo.save).toHaveBeenCalledTimes(1);
    expect(devicesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ deviceFingerprint: 'fp-1' }),
    );
  });
});
