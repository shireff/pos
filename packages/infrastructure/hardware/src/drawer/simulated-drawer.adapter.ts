import type { CashDrawer } from '@packages/application-sales';

/** Simulated/no-op drawer used as a fallback and in tests. */
export class SimulatedCashDrawer implements CashDrawer {
  public openCallCount = 0;

  public async open(): Promise<{ success: boolean }> {
    this.openCallCount += 1;
    return { success: true };
  }

  public async getStatus() {
    return { connected: false, isNoop: true } as const;
  }
}
