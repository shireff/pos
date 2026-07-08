import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { TokenIssuer } from '@packages/application-identity';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production-min-32-chars!!';
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 min
const REFRESH_TOKEN_BYTES = 32;

/**
 * JwtTokenIssuer — production-ready TokenIssuer using jsonwebtoken + Node crypto.
 * ACCESS tokens: HS256 JWT signed with JWT_SECRET env var, 15-min TTL.
 * REFRESH tokens: 32-byte cryptographically random hex strings.
 * Token hashing: SHA-256 for safe storage of refresh tokens.
 */
export class JwtTokenIssuer implements TokenIssuer {
  public issueAccessToken(payload: {
    userId: string;
    companyId: string;
    branchRoles: string[];
  }): string {
    return jwt.sign(payload, JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  public issueRefreshToken(): string {
    return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  }

  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public verifyAccessToken(
    token: string,
  ): { userId: string; companyId: string; branchRoles: string[] } | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        companyId: string;
        branchRoles: string[];
      };
      return payload;
    } catch {
      return null;
    }
  }
}

/**
 * PlatformAdminTokenIssuer — issues realm-separated platform-admin tokens.
 * Uses aud: 'platform-admin' claim for strict realm separation.
 */
export class PlatformAdminTokenIssuer {
  public issueAdminAccessToken(payload: { adminId: string }): string {
    return jwt.sign({ ...payload, aud: 'platform-admin' }, JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: 60 * 60,
    });
  }
}
