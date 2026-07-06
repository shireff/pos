import { MongoClient, Binary } from 'mongodb';
import { ClientEncryption } from 'mongodb-client-encryption';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

let clientEncryption: ClientEncryption | null = null;
let dataKeyId: Binary | null = null;

/**
 * Derives or retrieves the 96-byte Master Key from a secure simulation path.
 * In a real Tauri/Android environment, this bridges to native OS Keystores.
 */
export async function getMasterKey(): Promise<Buffer> {
  const keyEnv = process.env.DB_MASTER_KEY;
  if (keyEnv) {
    const buf = Buffer.from(keyEnv, 'hex');
    if (buf.length === 96) return buf;
  }

  // Headless simulation for tests/CI
  const keyPath = path.resolve(
    process.env.USERPROFILE || process.env.HOME || '.',
    '.smart_retail_os_key',
  );
  if (fs.existsSync(keyPath)) {
    const key = fs.readFileSync(keyPath);
    if (key.length === 96) return key;
  }

  const generated = crypto.randomBytes(96);
  fs.writeFileSync(keyPath, generated, { mode: 0o600 });
  return generated;
}

/**
 * Initializes CSFLE Client encryption.
 */
export async function initEncryption(client: MongoClient): Promise<void> {
  const masterKey = await getMasterKey();
  const kmsProviders = {
    local: {
      key: masterKey,
    },
  };

  const keyVaultDb = client.db('encryption');
  const keyVaultColl = keyVaultDb.collection('__keyVault');

  // Verify and create unique collection index
  await keyVaultColl.createIndex({ keyAltNames: 1 }, { unique: true, sparse: true });

  clientEncryption = new ClientEncryption(client, {
    keyVaultNamespace: 'encryption.__keyVault',
    kmsProviders,
  });

  const existingKey = await keyVaultColl.findOne({ keyAltNames: 'primary-data-key' });
  if (!existingKey) {
    dataKeyId = await clientEncryption.createDataKey('local', {
      keyAltNames: ['primary-data-key'],
    });
  } else {
    dataKeyId = existingKey._id as Binary;
  }
}

/**
 * Encrypts a string value.
 */
export async function encrypt(value: string): Promise<Binary> {
  if (!clientEncryption || !dataKeyId) {
    throw new Error('Encryption is not initialized. Call initEncryption() first.');
  }
  return await clientEncryption.encrypt(value, {
    keyId: dataKeyId,
    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
  });
}

/**
 * Decrypts a binary field.
 */
export async function decrypt(value: Binary): Promise<string> {
  if (!clientEncryption) {
    throw new Error('Encryption is not initialized. Call initEncryption() first.');
  }
  const result = await clientEncryption.decrypt(value);
  return result as string;
}
