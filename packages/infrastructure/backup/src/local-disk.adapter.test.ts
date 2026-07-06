import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { LocalDiskAdapter } from './local-disk.adapter';

const TEST_COMPANY_ID = 'company-test-001';
const RAW_DATA = Buffer.from(JSON.stringify({ test: 'data', value: 42, records: [1, 2, 3] }));

function makeKey(): Buffer {
  return crypto.randomBytes(32);
}

describe('LocalDiskAdapter', () => {
  let tempDir: string;
  let key: Buffer;
  let adapter: LocalDiskAdapter;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-test-'));
    key = makeKey();
    adapter = new LocalDiskAdapter(tempDir, key);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes a backup and creates encrypted + metadata files', async () => {
    const meta = await adapter.write(TEST_COMPANY_ID, RAW_DATA);

    expect(meta.id).toBeTruthy();
    expect(meta.companyId).toBe(TEST_COMPANY_ID);
    expect(meta.checksum).toMatch(/^[a-f0-9]{64}$/);

    const dataFile = path.join(tempDir, `${meta.id}.enc`);
    const metaFile = path.join(tempDir, `${meta.id}.meta.json`);

    expect(fs.existsSync(dataFile)).toBe(true);
    expect(fs.existsSync(metaFile)).toBe(true);

    // The encrypted file should NOT contain the raw data as plaintext
    const encContent = fs.readFileSync(dataFile);
    expect(encContent.toString()).not.toContain('test');
  });

  it('reads back the backup and verifies integrity checksum succeeds', async () => {
    const meta = await adapter.write(TEST_COMPANY_ID, RAW_DATA);
    const restored = await adapter.read(meta.id);

    expect(restored.toString()).toBe(RAW_DATA.toString());
  });

  it('corrupting 1 byte of the backup file causes integrity check to fail with a plain-language error', async () => {
    const meta = await adapter.write(TEST_COMPANY_ID, RAW_DATA);
    const dataFile = path.join(tempDir, `${meta.id}.enc`);

    const raw = fs.readFileSync(dataFile);
    raw[50] = raw[50] ^ 0xff; // Flip bits on byte 50
    fs.writeFileSync(dataFile, raw);

    await expect(adapter.read(meta.id)).rejects.toThrow(/corrupted|integrity check failed/i);
  });

  it('lists snapshots sorted by timestamp descending', async () => {
    await adapter.write(TEST_COMPANY_ID, RAW_DATA);
    await new Promise((r) => setTimeout(r, 10));
    await adapter.write(TEST_COMPANY_ID, RAW_DATA);

    const snapshots = adapter.listSnapshots();
    expect(snapshots.length).toBe(2);

    const [first, second] = snapshots;
    expect(new Date(first.createdAt) >= new Date(second.createdAt)).toBe(true);
  });
});
