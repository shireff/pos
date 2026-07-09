import { PlatformAdminUser } from '@packages/domain-platform-admin';

export interface PlatformAdminMfaSetupInput {
  email: string;
  password: string;
}

export interface PlatformAdminMfaSetupResult {
  adminId: string;
  setupToken: string;
}

/**
 * Step 1 of MFA enrollment: authenticate the admin with email + password and
 * hand back a short-lived setup token. The caller (route) is responsible for
 * generating the TOTP secret and persisting it as "pending" before returning
 * the QR code to the client.
 */
export class PlatformAdminMfaSetup {
  public constructor(
    private readonly adminByEmailAndPassword: (
      email: string,
      password: string,
    ) => Promise<PlatformAdminUser | null>,
  ) {}

  public async execute(input: PlatformAdminMfaSetupInput): Promise<PlatformAdminMfaSetupResult> {
    const admin = await this.adminByEmailAndPassword(input.email, input.password);
    if (!admin) {
      throw new Error('Invalid email or password');
    }

    if (!admin.isActive || admin.isLockedOut()) {
      throw new Error('Platform admin account is locked');
    }

    return {
      adminId: admin.id,
      setupToken: `mfa_setup_${admin.id}`,
    };
  }
}
