import { PlatformAdminUser } from '@packages/domain-platform-admin';

export interface PlatformAdminMfaVerifyInput {
  mfaChallengeToken: string; // expected format: `challenge_{adminId}`
  code: string; // 6-digit TOTP code
}

export interface PlatformAdminMfaVerifyOutput {
  adminAccessToken: string;
  admin: PlatformAdminUser;
}

export class PlatformAdminMfaVerify {
  public constructor(
    private readonly adminById: (id: string) => Promise<PlatformAdminUser | null>,
    private readonly verifyTotp: (secret: string | null, code: string) => Promise<boolean>,
    private readonly issueAdminAccessToken: (payload: { adminId: string }) => string,
  ) {}

  public async execute(input: PlatformAdminMfaVerifyInput): Promise<PlatformAdminMfaVerifyOutput> {
    const parts = input.mfaChallengeToken.split('_');
    const adminId = parts.slice(1).join('_');
    if (!adminId) throw new Error('Invalid challenge token');

    const admin = await this.adminById(adminId);
    if (!admin) throw new Error('Platform admin not found');

    if (!admin.isActive || admin.isLockedOut()) throw new Error('Platform admin account locked');

    const ok = await this.verifyTotp(admin.mfaSecret, input.code);
    if (!ok) {
      admin.recordFailedLogin();
      throw new Error('Invalid MFA code');
    }

    admin.recordSuccessfulLogin();
    const token = this.issueAdminAccessToken({ adminId: admin.id });
    return { adminAccessToken: token, admin };
  }
}
