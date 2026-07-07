import { PlatformAdminUser } from '@packages/domain-platform-admin';

export interface PlatformAdminLoginInput {
  email: string;
  password: string;
}

export interface PlatformAdminLoginOutput {
  challengeToken: string;
  admin: PlatformAdminUser;
}

export class PlatformAdminLogin {
  public constructor(
    private readonly adminByEmail: (email: string) => Promise<PlatformAdminUser | null>,
  ) {}

  public async execute(input: PlatformAdminLoginInput): Promise<PlatformAdminLoginOutput> {
    const admin = await this.adminByEmail(input.email);
    if (!admin) {
      throw new Error('Platform admin not found');
    }

    if (!admin.isActive || admin.isLockedOut()) {
      throw new Error('Platform admin account is locked');
    }

    if (!admin.isMfaEnrolled) {
      throw new Error('MFA enrollment required');
    }

    return {
      challengeToken: `challenge_${admin.id}`,
      admin,
    };
  }
}
