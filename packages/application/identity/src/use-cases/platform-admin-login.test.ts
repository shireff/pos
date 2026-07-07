import { describe, it, expect } from 'vitest';
import { PlatformAdminLogin } from './platform-admin-login';
import { PlatformAdminUser } from '@packages/domain-platform-admin';

describe('PlatformAdminLogin', () => {
  it('issues an MFA challenge when the admin is active and enrolled', async () => {
    const admin = PlatformAdminUser.create({
      name: 'Ops',
      email: 'ops@example.com',
      passwordHash: 'hash',
      role: 'support',
      mfaSecret: 'secret',
      isMfaEnrolled: true,
      isActive: true,
    });

    const useCase = new PlatformAdminLogin(async () => admin);
    const result = await useCase.execute({ email: 'ops@example.com', password: 'secret-pass' });

    expect(result.challengeToken).toContain('challenge_');
    expect(result.admin.email).toBe('ops@example.com');
  });
});
