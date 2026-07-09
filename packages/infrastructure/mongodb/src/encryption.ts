import { Binary, ClientEncryption, MongoClient } from 'mongodb';

let clientEncryption: ClientEncryption | null = null;
let dataKeyId: Binary | null = null;

// Webpack escape hatch: `__non_webpack_require__` is replaced by webpack with
// a real `require` that is NOT traced or bundled. This lets us load Node
// built-ins (`fs`, `path`) at runtime without webpack trying to resolve them
// at build time, which causes "Can't resolve 'fs'" in Next.js server builds.
declare const __non_webpack_require__: NodeRequire | undefined;
const nodeRequire: NodeRequire =
  typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : require;

/**
 * Derives or retrieves the 96-byte Master Key.
 *
 * Priority:
 *  1. DB_MASTER_KEY env var (production / CI — preferred, set as 192-char hex)
 *  2. Key file on disk at ~/.smart_retail_os_key (local dev simulation)
 */
export async function getMasterKey(): Promise<Buffer> {
  const keyEnv = process.env.DB_MASTER_KEY;
  if (keyEnv) {
    const buf = Buffer.from(keyEnv, 'hex');
    if (buf.length === 96) return buf;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = nodeRequire('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodePath = nodeRequire('path') as typeof import('path');

  const keyPath = nodePath.resolve(
    process.env.USERPROFILE || process.env.HOME || '.',
    '.smart_retail_os_key',
  );

  if (fs.existsSync(keyPath)) {
    const key = fs.readFileSync(keyPath);
    if (key.length === 96) return key;
  }

  const randomBytes = new Uint8Array(96);
  globalThis.crypto.getRandomValues(randomBytes);
  const generated = Buffer.from(randomBytes);
  fs.writeFileSync(keyPath, generated, { mode: 0o600 });
  return generated;
}

/**
 * Initializes CSFLE Client encryption.
 */
export async function initEncryption(client: MongoClient): Promise<void> {
  const masterKey = await getMasterKey();
  const kmsProviders = { local: { key: masterKey } };

  const keyVaultDb = client.db('encryption');
  const keyVaultColl = keyVaultDb.collection<{ _id: Binary; keyAltNames?: string[] }>('__keyVault');

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
    dataKeyId = existingKey._id;
  }
}

/**
 * Encrypts a string value using deterministic AES-256.
 */
export async function encrypt(value: string): Promise<Binary> {
  if (!clientEncryption || !dataKeyId) {
    throw new Error('Encryption is not initialized. Call initEncryption() first.');
  }
  return clientEncryption.encrypt(value, {
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
  return clientEncryption.decrypt(value) as Promise<string>;
}
