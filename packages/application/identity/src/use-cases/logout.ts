import type { RefreshTokenRepository, TokenIssuer } from '../ports';

export interface LogoutInput {
  refreshToken: string;
}

export interface LogoutOutput {
  revoked: boolean;
}

export class Logout {
  public constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  public async execute(input: LogoutInput): Promise<LogoutOutput> {
    const hash = this.tokenIssuer.hashToken(input.refreshToken);
    const record = await this.refreshTokens.findByHash(hash);
    if (!record || record.revokedAt) {
      throw new Error('Invalid or already revoked refresh token');
    }

    await this.refreshTokens.revoke(hash);

    return { revoked: true };
  }
}
