import { describe, it, expect } from 'vitest';
import { Money } from './money';

describe('Money Value Object', () => {
  it('stores integer piasters, never floats', () => {
    const money = Money.fromEgp(10.25);
    expect(money.getPiasters()).toBe(1025);
    expect(Number.isInteger(money.getPiasters())).toBe(true);

    expect(() => Money.fromPiasters(10.5)).toThrow();
  });

  it('handles addition correctly', () => {
    const m1 = Money.fromPiasters(100);
    const m2 = Money.fromPiasters(200);
    const result = m1.add(m2);
    expect(result.getPiasters()).toBe(300);
  });

  it('handles subtraction correctly', () => {
    const m1 = Money.fromPiasters(500);
    const m2 = Money.fromPiasters(200);
    const result = m1.subtract(m2);
    expect(result.getPiasters()).toBe(300);
  });

  it('handles multiplication correctly', () => {
    const m1 = Money.fromPiasters(100);
    const result = m1.multiply(3);
    expect(result.getPiasters()).toBe(300);
  });

  it('provides Money.ZERO as 0 piasters', () => {
    const zero = Money.ZERO;
    expect(zero.getPiasters()).toBe(0);
  });

  it('throws on negative values unless explicitly allowed', () => {
    expect(() => Money.fromPiasters(-100)).toThrow();
    const negOk = Money.fromPiasters(-100, true);
    expect(negOk.getPiasters()).toBe(-100);
  });

  it('formats to EGP string correctly', () => {
    const money = Money.fromPiasters(10000);
    expect(money.format()).toBe('100.00 EGP');
  });

  it('avoids floating point drift in arithmetic', () => {
    const m1 = Money.fromEgp(0.1);
    const m2 = Money.fromEgp(0.2);
    const result = m1.add(m2);
    expect(result.getEgp()).toBe(0.3);
    expect(result.getPiasters()).toBe(30);
  });
});
