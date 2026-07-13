import { describe, it, expect } from 'vitest';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { LocalDiskAdapter } from './local-disk.adapter';

describe('LocalDiskAdapter', () => {
  it('encrypts, then decrypts back to the original payload', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sro-disk-'));
    const key = Buffer.alloc(32, 7);
    const adapter = new LocalDiskAdapter(dir, key);

    const meta = await adapter.write('company-1', Buffer.from('smart-retail-os-payload'));
    const out = await adapter.read(meta.id);
    expect(out.toString()).toBe('smart-retail-os-payload');
  });

  it('fails integrity verification on tampered data', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sro-disk-'));
    const key = Buffer.alloc(32, 9);
    const adapter = new LocalDiskAdapter(dir, key);

    const meta = await adapter.write('company-1', Buffer.from('original'));
    const encrypted = adapter.getEncryptedData(meta.id);
    const tampered = Buffer.from(encrypted);
    tampered[20] ^= 0xff; // flip a byte

    await expect(adapter.decrypt(tampered, meta.checksum)).rejects.toThrow(/integrity/i);
  });

  it('rejects an incorrect key length', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sro-disk-'));
    expect(() => new LocalDiskAdapter(dir, Buffer.alloc(16))).toThrow(/32/);
  });
});
