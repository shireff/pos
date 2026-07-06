import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HybridLogicalClock } from './hlc';

describe('Hybrid Logical Clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('HLC advances on local event (logical counter increments)', () => {
    const clockRaw = 1680000000000;
    vi.setSystemTime(clockRaw);

    const hlc1 = HybridLogicalClock.generateInitial('node-a');
    expect(hlc1.time).toBe(clockRaw);
    expect(hlc1.logical).toBe(0);

    const hlc2 = hlc1.advance();
    expect(hlc2.time).toBe(clockRaw);
    expect(hlc2.logical).toBe(1);
  });

  it('HLC updates to max(local, incoming) + 1 when receiving a remote clock', () => {
    const clockRaw = 1680000000000;
    vi.setSystemTime(clockRaw);

    const hlcLocal = new HybridLogicalClock(clockRaw, 2, 'node-a');
    const hlcIncoming = new HybridLogicalClock(clockRaw, 5, 'node-b');

    const result = hlcLocal.update(hlcIncoming);
    expect(result.time).toBe(clockRaw);
    expect(result.logical).toBe(6);
    expect(result.nodeId).toBe('node-a'); // maintains local node identity
  });

  it('detects sequential edits produce causally ordered HLC values', () => {
    const hlc1 = HybridLogicalClock.generateInitial('node-a');
    const hlc2 = hlc1.advance();
    const hlc3 = hlc2.advance();

    expect(hlc2.compare(hlc1)).toBeGreaterThan(0);
    expect(hlc3.compare(hlc2)).toBeGreaterThan(0);
  });

  it('HLC serializes to string and deserializes without loss', () => {
    const hlc = new HybridLogicalClock(1680000000000, 3, 'node-xyz');
    const str = hlc.toString();
    expect(str).toBe('1680000000000:3:node-xyz');

    const parsed = HybridLogicalClock.parse(str);
    expect(parsed.time).toBe(hlc.time);
    expect(parsed.logical).toBe(hlc.logical);
    expect(parsed.nodeId).toBe(hlc.nodeId);
  });

  it('fails to parse corrupt HLC strings', () => {
    expect(() => HybridLogicalClock.parse('corrupt-string')).toThrow();
    expect(() => HybridLogicalClock.parse('123:abc:node')).toThrow();
  });
});
