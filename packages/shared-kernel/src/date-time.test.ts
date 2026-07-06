import { describe, it, expect } from 'vitest';
import { DateTime } from './date-time';

describe('DateTime Value Object', () => {
  it('wraps UTC timestamp and converts back to ISO', () => {
    const isoString = '2026-07-06T12:00:00.000Z';
    const dt = DateTime.fromIso(isoString);
    expect(dt.toIso()).toBe(isoString);
  });

  it('renders UTC timestamps correctly in Africa/Cairo timezone', () => {
    // Cairo is UTC+2 (or UTC+3 during daylight saving time)
    // 2026-07-06T12:00:00.000Z -> 2026-07-06 15:00:00 (Cairo DST is UTC+3 in July)
    const dt = DateTime.fromIso('2026-07-06T12:00:00.000Z');
    const cairoStr = dt.toCairoString();
    expect(cairoStr).toBe('2026-07-06 15:00:00');
  });

  it('throws on invalid ISO strings', () => {
    expect(() => DateTime.fromIso('invalid-date')).toThrow();
  });

  it('compares correctly dates', () => {
    const d1 = DateTime.fromIso('2023-01-01T00:00:00.000Z');
    const d2 = DateTime.fromIso('2023-01-02T00:00:00.000Z');
    expect(d1.isBefore(d2)).toBe(true);
    expect(d2.isAfter(d1)).toBe(true);
    expect(d1.equals(DateTime.fromIso('2023-01-01T00:00:00.000Z'))).toBe(true);
  });
});
