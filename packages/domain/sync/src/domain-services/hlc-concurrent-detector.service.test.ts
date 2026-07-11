import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { HlcConcurrentDetector } from './hlc-concurrent-detector.service';

const hlc = (time: number, logical: number, nodeId: string) =>
  new HybridLogicalClock(time, logical, nodeId);

describe('HlcConcurrentDetector', () => {
  it('detects causal ordering by (time, logical)', () => {
    expect(HlcConcurrentDetector.isCausallyAfter(hlc(10, 1, 'A'), hlc(10, 0, 'B'))).toBe(true);
    expect(HlcConcurrentDetector.isCausallyAfter(hlc(11, 0, 'A'), hlc(10, 9, 'B'))).toBe(true);
    expect(HlcConcurrentDetector.isCausallyAfter(hlc(10, 0, 'A'), hlc(10, 1, 'B'))).toBe(false);
  });

  it('treats equal (time, logical) coordinates as concurrent', () => {
    expect(HlcConcurrentDetector.areConcurrent(hlc(10, 0, 'A'), hlc(10, 0, 'B'))).toBe(true);
    expect(HlcConcurrentDetector.areConcurrent(hlc(10, 1, 'A'), hlc(10, 0, 'B'))).toBe(false);
  });

  it('flags concurrent conflict only when nodes differ', () => {
    expect(HlcConcurrentDetector.isConcurrentConflict(hlc(10, 0, 'A'), hlc(10, 0, 'B'))).toBe(true);
    expect(HlcConcurrentDetector.isConcurrentConflict(hlc(10, 0, 'A'), hlc(10, 0, 'A'))).toBe(false);
  });

  it('treats same coordinate + same node as the same event (idempotent)', () => {
    expect(HlcConcurrentDetector.isSameEvent(hlc(10, 0, 'A'), hlc(10, 0, 'A'))).toBe(true);
    expect(HlcConcurrentDetector.isSameEvent(hlc(10, 0, 'A'), hlc(10, 0, 'B'))).toBe(false);
  });
});
