import { NextRequest, NextResponse } from 'next/server';
import { PlatformAdminMfaVerify } from '@packages/application-identity';
import { ValidationError, handleApiError } from '../../../../../lib/errors';
import { MfaVerifySchema } from '@packages/shared-kernel';
import { PlatformAdminUser } from '@packages/domain-platform-admin';
import { getMongoDb } from '../../../../../lib/cloud-db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.PLATFORM_ADMIN_JWT_SECRET ?? 'dev-platform-admin-secret-change-in-prod';

/**
 * RFC 6238 TOTP verification — no external library required.
 * Compatible with Google Authenticator / standard TOTP apps.
 */
function verifyTotp(secret: string | null, code: string): boolean {
  if (!secret) return false;

  try {
    // Decode base32 secret
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const secretUpper = secret.toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let bitCount = 0;
    const bytes: number[] = [];
    for (const char of secretUpper) {
      const val = base32Chars.indexOf(char);
      if (val < 0) continue;
      bits = (bits << 5) | val;
      bitCount += 5;
      if (bitCount >= 8) {
        bytes.push((bits >> (bitCount - 8)) & 0xff);
        bitCount -= 8;
      }
    }
    const keyBuffer = Buffer.from(bytes);

    // Try current window ±1 step (30 second window)
    const step = Math.floor(Date.now() / 1000 / 30);
    for (const delta of [-1, 0, 1]) {
      const counter = step + delta;
      const counterBuffer = Buffer.alloc(8);
      // Write counter as big-endian 64-bit int
      counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
      counterBuffer.writeUInt32BE(counter >>> 0, 4);

      const hmac = crypto.createHmac('sha1', keyBuffer).update(counterBuffer).digest();
      const offset = hmac[hmac.length - 1] & 0x0f;
      const otp =
        (((hmac[offset] & 0x7f) << 24) |
          ((hmac[offset + 1] & 0xff) << 16) |
          ((hmac[offset + 2] & 0xff) << 8) |
          (hmac[offset + 3] & 0xff)) %
        1000000;

      if (otp.toString().padStart(6, '0') === code) return true;
    }
    return false;
  } catch {
    return false;
  }
}

const adminById = async (adminId: string): Promise<PlatformAdminUser | null> => {
  const db = await getMongoDb();
  // adminId is the UUID stored as _id in platform_admins
  const doc = await db
    .collection<any>('platform_admins')
    .findOne({ _id: adminId, is_active: true });
  if (!doc) return null;

  return PlatformAdminUser.create({
    name: doc.name ?? doc.email.split('@')[0],
    email: doc.email,
    passwordHash: doc.password_hash,
    role: doc.role,
    mfaSecret: doc.mfa_secret,
    isMfaEnrolled: Boolean(doc.mfa_secret),
    isActive: doc.is_active,
  });
};

const issueAdminAccessToken = (payload: { adminId: string }): string => {
  return jwt.sign(
    {
      sub: payload.adminId,
      role: 'platform_admin',
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: '8h' },
  );
};

const useCase = new PlatformAdminMfaVerify(
  adminById,
  async (secret, code) => verifyTotp(secret, code),
  issueAdminAccessToken,
);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = MfaVerifySchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(`Invalid request: ${parsed.error.message}`);
    }

    const result = await useCase.execute(parsed.data);

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken: result.adminAccessToken,
          admin: {
            id: result.admin.id,
            name: result.admin.name,
            email: result.admin.email,
            role: result.admin.role,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, request);
  }
}
