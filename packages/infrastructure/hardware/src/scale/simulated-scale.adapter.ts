import type { Scale, WeightReading } from '@packages/application-sales';

/**
 * SimulatedScale is the no-op / test double adapter used when no physical scale
 * is attached and in CI contract tests. It reports a zero reading so callers can
 * still exercise the weight flow without hardware (Hardware.md §5).
 */
export class SimulatedScale implements Scale {
  public tareCallCount = 0;

  public async readWeight(): Promise<WeightReading> {
    return { grams: 0, unit: 'kg', isStable: true };
  }

  public async tare(): Promise<void> {
    this.tareCallCount += 1;
  }

  public async getStatus() {
    return { connected: false, isNoop: true } as const;
  }
}
