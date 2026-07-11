import type { ReceiptPrinter } from '@packages/application-sales';
import type { ReceiptPayload, PrintResult } from './types';

/**
 * SimulatedReceiptPrinter is the no-op / test double adapter used when no
 * physical printer is attached (Hardware.md §1) and in CI contract tests.
 * It records the last printed payload so callers and tests can assert on it.
 */
export class SimulatedReceiptPrinter implements ReceiptPrinter {
  public lastPayload: ReceiptPayload | null = null;
  public printCallCount = 0;

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async print(receipt: ReceiptPayload): Promise<PrintResult> {
    this.lastPayload = receipt;
    this.printCallCount += 1;
    return { success: true, fallbackRequired: false };
  }
}
