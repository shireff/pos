import crypto from 'crypto';
import QRCode from 'qrcode';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Decode a base32 (RFC 4648, no padding) secret into bytes. */
export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let bitCount = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const val = BASE32_CHARS.indexOf(char);
    if (val < 0) continue;
    bits = (bits << 5) | val;
    bitCount += 5;
    if (bitCount >= 8) {
      bytes.push((bits >> (bitCount - 8)) & 0xff);
      bitCount -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * RFC 6238 TOTP verification (±1 step of 30s). Compatible with Google
 * Authenticator / standard TOTP apps. Accepts a base32 secret.
 */
export function verifyTotp(secret: string | null, code: string): boolean {
  if (!secret) return false;
  try {
    const keyBuffer = base32Decode(secret);
    const step = Math.floor(Date.now() / 1000 / 30);
    for (const delta of [-1, 0, 1]) {
      const counter = step + delta;
      const counterBuffer = Buffer.alloc(8);
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

/** Generate a random base32 TOTP secret (160 bits / 20 bytes by default). */
export function generateTotpSecret(byteLength = 20): string {
  const bytes = crypto.randomBytes(byteLength);
  let bits = 0;
  let bitCount = 0;
  let out = '';
  for (const b of bytes) {
    bits = (bits << 8) | b;
    bitCount += 8;
    while (bitCount >= 5) {
      bitCount -= 5;
      out += BASE32_CHARS[(bits >> bitCount) & 0x1f];
    }
  }
  if (bitCount > 0) {
    out += BASE32_CHARS[(bits << (5 - bitCount)) & 0x1f];
  }
  return out;
}

/** Build an `otpauth://` URI suitable for Authenticator apps and QR codes. */
export function buildOtpAuthUri(opts: {
  issuer: string;
  account: string;
  secret: string;
}): string {
  const label = encodeURIComponent(`${opts.issuer}:${opts.account}`);
  const params = new URLSearchParams({
    secret: opts.secret,
    issuer: opts.issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Render an otpauth URI as a PNG data URL for direct <img src> use. */
export async function generateQrDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri);
}
