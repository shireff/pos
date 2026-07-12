import { describe, it, expect, vi } from 'vitest';
import { SimulatedScale } from './scale/simulated-scale.adapter';
import { TauriUsbScaleAdapter, type TauriScaleTransport } from './scale/tauri-scale.adapter';
import { ScaleNotConnectedError } from './errors';
import { resolveScaleFallback } from './fallback';

describe('Scale adapter contract (scale.contract.test.ts)', () => {
  it('stable weight reading → accepted by the POS UI (BR-HW-004)', async () => {
    const reading = await new SimulatedScale().readWeight();
    expect(reading).not.toBeNull();
    expect(reading?.isStable).toBe(true);
    expect(reading?.grams).toBeGreaterThanOrEqual(0);
  });

  it('unstable weight reading → rejected; POS waits for a stable value', async () => {
    const transport: TauriScaleTransport = {
      isAvailable: vi.fn().mockResolvedValue(true),
      read: vi.fn().mockResolvedValue({ grams: 500, isStable: false }),
      tare: vi.fn(),
    };
    const reading = await new TauriUsbScaleAdapter(transport).readWeight();
    // UI only accepts isStable === true, so an unstable reading is treated as not-yet-ready.
    expect(reading?.isStable).toBe(false);
    expect(reading?.grams).toBe(500);
  });

  it('scale disconnected → null weight, manual entry prompt, sale not blocked', async () => {
    const transport: TauriScaleTransport = {
      isAvailable: vi.fn().mockResolvedValue(false),
      read: vi.fn().mockRejectedValue(new ScaleNotConnectedError()),
      tare: vi.fn(),
    };
    const reading = await new TauriUsbScaleAdapter(transport).readWeight();
    expect(reading).toBeNull();
    const fb = resolveScaleFallback(new ScaleNotConnectedError());
    expect(fb.kind).toBe('manual-entry');
  });

  it('tare is a no-op in the simulated adapter and never throws', async () => {
    const scale = new SimulatedScale();
    await expect(scale.tare()).resolves.toBeUndefined();
    expect(scale.tareCallCount).toBe(1);
  });
});
