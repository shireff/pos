import { describe, it, expect, vi } from 'vitest';
import { PlatformAdminMfaVerify } from './platform-admin-mfa-verify';
import { PlatformAdminUser } from '@packages/domain-platform-admin';

describe('PlatformAdminMfaVerify', () => {
  it('verifies TOTP and returns adminAccessToken', async () => {
    const admin = PlatformAdminUser.create({
      name: 'Ops',
      email: 'ops@example.com',
      passwordHash: 'hash',
      role: 'super_admin',
      mfaSecret: 'secret',
      isMfaEnrolled: true,
      isActive: true,
    });

    const adminById = vi.fn().mockResolvedValue(admin);
    const verifyTotp = vi.fn().mockResolvedValue(true);
    const issueAdminAccessToken = vi.fn().mockReturnValue('admin_token_123');

    const useCase = new PlatformAdminMfaVerify(
      adminById as (id: string) => Promise<PlatformAdminUser | null>,
      verifyTotp as (secret: string, code: string) => Promise<boolean>,
      issueAdminAccessToken as (userId: string) => string,
    );
    const result = await useCase.execute({
      mfaChallengeToken: `challenge_${admin.id}`,
      code: '123456',
    });

    expect(result.adminAccessToken).toBe('admin_token_123');
    expect(verifyTotp).toHaveBeenCalledWith('secret', '123456');
  });
});
