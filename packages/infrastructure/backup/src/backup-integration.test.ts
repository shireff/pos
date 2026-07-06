import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { LocalDiskAdapter } from './local-disk.adapter';

/**
 * Backup Integration Test
 *
 * Full end-to-end scenarios:
 *   1. Clean backup → restore succeeds and returns original data
 *   2. Corrupt file (tampered bytes) → restore FAILS with plain-language error
 *   3. Missing file → restore FAILS with plain-language error
 *   4. Multiple backups → list returns all, newest first
 *   5. Wrong encryption key → restore FAILS
 */

const TEST_DIR = path.join(os.tmpdir(), `smart-retail-backup-integration-${Date.now()}`);
const BACKUP_KEY = crypto.randomBytes(32); // AES-256

describe('Backup Integration — full backup → restore lifecycle', () => {
  let adapter: LocalDiskAdapter;

  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    adapter = new LocalDiskAdapter(TEST_DIR, BACKUP_KEY);
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  // ─── Scenario 1: Clean backup → restore succeeds ──────────────────────────

  it('clean backup → restore returns the original data', async () => {
    const originalData = Buffer.from(
      JSON.stringify({ orders: [{ id: 'ord-001', total: 12345 }] }),
      'utf8',
    );

    const meta = await adapter.write('company-1', originalData);

    expect(meta.id).toBeTruthy();
    expect(meta.checksum).toBeTruthy();
    expect(meta.companyId).toBe('company-1');

    const restored = await adapter.read(meta.id);
    expect(restored.toString('utf8')).toEqual(originalData.toString('utf8'));
  });

  // ─── Scenario 2: Corrupt file → restore FAILS with plain-language error ───

  it('corrupted backup file → restore fails with plain-language integrity error', async () => {
    const originalData = Buffer.from('{"orders":[]}', 'utf8');
    const meta = await adapter.write('company-1', originalData);

    // Tamper with the encrypted file — flip random bytes in the middle
    const encPath = meta.filePath;
    if (!encPath) {
      throw new Error('Backup metadata is missing the encrypted file path.');
    }
    const raw = fs.readFileSync(encPath);
    const tampered = Buffer.from(raw);
    // Corrupt bytes 30-40 (inside ciphertext, after IV+authTag)
    for (let i = 30; i < Math.min(40, tampered.length); i++) {
      tampered[i] = tampered[i] ^ 0xff;
    }
    fs.writeFileSync(encPath, tampered);

    await expect(adapter.read(meta.id)).rejects.toThrow(/corrupted or tampered/i);
  });

  it('corrupted backup file → error message is plain-language (no stack trace exposure)', async () => {
    const originalData = Buffer.from('sensitive data', 'utf8');
    const meta = await adapter.write('company-1', originalData);

    // Overwrite the checksum in metadata to simulate a DIFFERENT kind of corruption
    // (metadata pointing to wrong checksum — simulates storage corruption)
    const metaPath = path.join(TEST_DIR, `${meta.id}.meta.json`);
    const metaObj = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    metaObj.checksum = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    fs.writeFileSync(metaPath, JSON.stringify(metaObj));

    let caughtError: Error | null = null;
    try {
      await adapter.read(meta.id);
    } catch (e) {
      caughtError = e as Error;
    }

    expect(caughtError).not.toBeNull();
    // Must be human-readable, not an internal stack reference
    expect(caughtError!.message).toMatch(/corrupted or tampered|integrity check failed/i);
    expect(caughtError!.message).toMatch(/restore point/i);
    // Must not expose internal paths or crypto internals
    expect(caughtError!.message).not.toMatch(/at Object\.|\.stack|cipher|decipher/i);
  });

  // ─── Scenario 3: Missing file → restore FAILS ─────────────────────────────

  it('missing backup file → restore fails with plain-language not-found error', async () => {
    await expect(adapter.read('non-existent-backup-id')).rejects.toThrow(/not found/i);
  });

  // ─── Scenario 4: Multiple backups → listSnapshots newest first ────────────

  it('multiple backups → listSnapshots returns all, newest first', async () => {
    const data1 = Buffer.from('backup-1', 'utf8');
    const data2 = Buffer.from('backup-2', 'utf8');
    const data3 = Buffer.from('backup-3', 'utf8');

    // Write with slight delays to ensure different timestamps
    const meta1 = await adapter.write('company-1', data1);
    await new Promise((r) => setTimeout(r, 10));
    const meta2 = await adapter.write('company-1', data2);
    await new Promise((r) => setTimeout(r, 10));
    const meta3 = await adapter.write('company-1', data3);

    const snapshots = adapter.listSnapshots();
    expect(snapshots.length).toBe(3);

    // Newest first
    const timestamps = snapshots.map((s) => new Date(s.createdAt).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
    }

    // All IDs present
    const ids = snapshots.map((s) => s.id);
    expect(ids).toContain(meta1.id);
    expect(ids).toContain(meta2.id);
    expect(ids).toContain(meta3.id);
  });

  // ─── Scenario 5: Wrong encryption key → restore FAILS ────────────────────

  it('backup written with key-A cannot be restored with key-B', async () => {
    const keyA = crypto.randomBytes(32);
    const keyB = crypto.randomBytes(32);

    const adapterA = new LocalDiskAdapter(TEST_DIR, keyA);
    const adapterB = new LocalDiskAdapter(TEST_DIR, keyB);

    const originalData = Buffer.from('top secret', 'utf8');
    const meta = await adapterA.write('company-1', originalData);

    // adapterB uses a different key — checksum mismatch or GCM auth failure
    await expect(adapterB.read(meta.id)).rejects.toThrow();
  });

  // ─── Scenario 6: getPayload returns correct structure ─────────────────────

  it('getPayload returns well-formed BackupPayload with all fields', async () => {
    const data = Buffer.from('{"test":true}', 'utf8');
    const meta = await adapter.write('company-42', data);

    const payload = await adapter.getPayload(meta.id);

    expect(payload.id).toBe(meta.id);
    expect(payload.companyId).toBe('company-42');
    expect(payload.checksum).toBe(meta.checksum);
    expect(payload.version).toBe(1);
    expect(payload.encryptedData).toBeInstanceOf(Buffer);
    expect(payload.iv).toBeTruthy();
    expect(payload.createdAt).toBeTruthy();
  });
});
