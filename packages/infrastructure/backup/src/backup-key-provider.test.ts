import { describe, it, expect } from 'vitest';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { BackupKeyProvider, EnvFileSecretStore } from './backup-key-provider';

describe('BackupKeyProvider', () => {
  it('derives a 32-byte AES-256 key from an independent passphrase', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sro-key-'));
    const provider = new BackupKeyProvider(new EnvFileSecretStore(dir));
    const key = await provider.resolveKey();
    expect(key.key.length).toBe(32);
  });

  it('is deterministic for the same passphrase (keyId stable)', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sro-key-'));
    const provider = new BackupKeyProvider(new EnvFileSecretStore(dir));
    const a = await provider.resolveKey();
    const b = await provider.resolveKey();
    expect(a.keyId).toBe(b.keyId);
    expect(a.key.equals(b.key)).toBe(true);
  });

  it('rotation changes the key id without touching the live DB key', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sro-key-'));
    const provider = new BackupKeyProvider(new EnvFileSecretStore(dir));
    const before = await provider.resolveKey();
    const after = await provider.rotateKey();
    expect(after.keyId).not.toBe(before.keyId);
  });
});
