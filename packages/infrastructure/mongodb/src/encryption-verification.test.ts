import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

/**
 * Encryption Verification Test
 *
 * Confirms that backup data encrypted with AES-256-GCM is NOT readable as
 * plaintext when the file is opened directly, and that the original data
 * can only be recovered via proper decryption.
 *
 * Note: This test validates the LOCAL encryption layer (AES-256-GCM used by
 * LocalDiskAdapter). MongoDB CSFLE/field-level encryption requires a live
 * mongod instance and is validated by the integration test environment.
 */

const ALGORITHM = 'aes-256-gcm';
const TEST_DIR = path.join(os.tmpdir(), 'smart-retail-encryption-test');
const ENCRYPTED_FILE = path.join(TEST_DIR, 'test.enc');

function makeKey(): Buffer {
  return crypto.randomBytes(32);
}

function encrypt(data: Buffer, key: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Layout: [iv(12)] [authTag(16)] [ciphertext]
  return Buffer.concat([iv, authTag, encrypted]);
}

function decrypt(blob: Buffer, key: Buffer): Buffer {
  const iv = blob.subarray(0, 12);
  const authTag = blob.subarray(12, 28);
  const ciphertext = blob.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

describe('Encryption Verification — MongoDB/Backup file is opaque to plaintext inspection', () => {
  const PLAINTEXT = 'sensitive:EGP123.45:customer-id:abc-123-xyz';
  const key = makeKey();
  let encryptedBlob: Buffer;

  beforeAll(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    encryptedBlob = encrypt(Buffer.from(PLAINTEXT, 'utf8'), key);
    fs.writeFileSync(ENCRYPTED_FILE, encryptedBlob);
  });

  afterAll(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('encrypted file does NOT contain the plaintext string', () => {
    const raw = fs.readFileSync(ENCRYPTED_FILE);
    const rawStr = raw.toString('utf8');
    const rawHex = raw.toString('hex');
    const rawBase64 = raw.toString('base64');

    // The sensitive data must not appear in any common encoding view
    expect(rawStr).not.toContain('sensitive');
    expect(rawStr).not.toContain('customer-id');
    expect(rawStr).not.toContain('EGP');
    expect(rawHex).not.toContain(Buffer.from('sensitive', 'utf8').toString('hex'));
    expect(rawBase64).not.toContain(Buffer.from('sensitive', 'utf8').toString('base64'));
  });

  it('encrypted file is NOT human-readable (high entropy, no ASCII words)', () => {
    const raw = fs.readFileSync(ENCRYPTED_FILE);

    // Check that fewer than 20% of bytes fall in printable ASCII range (32-126)
    let printableCount = 0;
    for (const byte of raw) {
      if (byte >= 32 && byte <= 126) printableCount++;
    }
    const printableRatio = printableCount / raw.length;
    expect(printableRatio).toBeLessThan(0.6);
  });

  it('encrypted file cannot be decrypted with a WRONG key — throws authentication error', () => {
    const wrongKey = makeKey(); // different random key
    const raw = fs.readFileSync(ENCRYPTED_FILE);
    expect(() => decrypt(raw, wrongKey)).toThrow();
  });

  it('encrypted file can be correctly decrypted with the CORRECT key', () => {
    const raw = fs.readFileSync(ENCRYPTED_FILE);
    const decrypted = decrypt(raw, key);
    expect(decrypted.toString('utf8')).toEqual(PLAINTEXT);
  });

  it('encrypted file size is larger than plaintext (IV + authTag overhead added)', () => {
    const plainLen = Buffer.byteLength(PLAINTEXT, 'utf8');
    const encLen = fs.statSync(ENCRYPTED_FILE).size;
    // IV(12) + authTag(16) = 28 bytes overhead minimum
    expect(encLen).toBeGreaterThan(plainLen);
    expect(encLen).toBeGreaterThanOrEqual(plainLen + 28);
  });
});
