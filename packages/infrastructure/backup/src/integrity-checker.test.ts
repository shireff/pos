import { describe, it, expect } from 'vitest';
import { IntegrityChecker } from './integrity-checker';

describe('IntegrityChecker', () => {
  it('computes a stable SHA-256 checksum', () => {
    const data = Buffer.from('smart-retail-os');
    expect(IntegrityChecker.computeChecksum(data)).toBe(IntegrityChecker.computeChecksum(data));
  });

  it('passes when checksum matches', () => {
    const data = Buffer.from('smart-retail-os');
    const checksum = IntegrityChecker.computeChecksum(data);
    const result = IntegrityChecker.verify(data, checksum);
    expect(result.pass).toBe(true);
    expect(result.message).toContain('تم التحقق');
  });

  it('fails with a plain-language message on mismatch', () => {
    const result = IntegrityChecker.verify(Buffer.from('a'), 'deadbeef');
    expect(result.pass).toBe(false);
    expect(result.message).toContain('فشل');
  });
});
