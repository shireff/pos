import crypto from 'crypto';
import type { PasswordHasher } from '@packages/application-identity';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/**
 * ScryptPasswordHasher — production-ready PasswordHasher using Node.js native crypto.scrypt.
 * No external dependencies needed.
 * Hash format: "scrypt$<base64-salt>$<base64-hash>"
 *
 * OWASP-recommended parameters for interactive logins:
 * N=16384, r=8, p=1, keyLen=64 bytes
 */
export class ScryptPasswordHasher implements PasswordHasher {
  public async hash(plaintext: string): Promise<string> {
    const salt = crypto.randomBytes(SALT_BYTES);
    const hash = await this.deriveKey(plaintext, salt);
    return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
  }

  public async verify(plaintext: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

    const salt = Buffer.from(parts[1], 'base64');
    const expected = Buffer.from(parts[2], 'base64');
    const actual = await this.deriveKey(plaintext, salt);

    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
  }

  private deriveKey(plaintext: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.scrypt(
        plaintext,
        salt,
        KEY_LENGTH,
        { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
        (err, key) => {
          if (err) reject(err);
          else resolve(key);
        },
      );
    });
  }
}
