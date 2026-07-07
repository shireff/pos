import type { RefreshTokenRepository, TokenIssuer } from '../ports';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
}

export class RefreshToken {
  public constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  public async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const hash = this.tokenIssuer.hashToken(input.refreshToken);
    const record = await this.refreshTokens.findByHash(hash);
    if (!record || record.revokedAt) {
      throw new Error('Invalid or revoked refresh token');
    }

    await this.refreshTokens.revoke(hash);

    const accessToken = this.tokenIssuer.issueAccessToken({
      userId: record.userId,
      companyId: record.companyId,
      branchRoles: record.branchRoles,
    });

    return { accessToken };
  }
}
