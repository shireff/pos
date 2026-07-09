import crypto from 'crypto';

/**
 * Scrypt password hasher for tenant (company) user auth.
 * Hash format: scrypt$<salt_hex>$<derived_key_hex> (64-byte key).
 */
export class ScryptPasswordHasher {
  public async hash(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64);
    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
  }

  public async verify(password: string, stored: string): Promise<boolean> {
    try {
      const parts = stored.split('$');
      if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
      const [, saltHex, keyHex] = parts;
      const expected = Buffer.from(keyHex, 'hex');
      const derived = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
      return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
    } catch {
      return false;
    }
  }
}

/**
 * Verify a scrypt-hashed password stored by the platform-admin seed utility.
 * Format: scrypt$<salt_hex>$<derived_key_hex>
 *
 * The derived key was originally hashed with the salt passed as a hex *string*
 * (Node treated it as UTF-8 bytes). We accept both that legacy encoding and the
 * canonical hex-decoded Buffer form, so hashes already in the database keep
 * working after the seed was corrected.
 */
export function verifyPassword(input: string, stored: string): boolean {
  try {
    const parts = stored.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
    const [, saltHex, keyHex] = parts;
    const expected = Buffer.from(keyHex, 'hex');

    const candidates = [
      Buffer.from(saltHex, 'hex'), // canonical: salt decoded from hex
      Buffer.from(saltHex, 'utf8'), // legacy seed: salt used as a hex string
    ];
    for (const salt of candidates) {
      const derived = crypto.scryptSync(input, salt, 64);
      if (derived.length === expected.length && crypto.timingSafeEqual(derived, expected)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
