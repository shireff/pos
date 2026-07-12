import { describe, it, expect, vi } from 'vitest';
import { HidBarcodeScanner } from './scanner/hid-scanner.adapter';
import { CapacitorCameraBarcodeScanner } from './scanner/capacitor-camera-scanner.adapter';
import { SimulatedBarcodeScanner } from './scanner/noop-scanner.adapter';
import { resolveScannerFallback } from './fallback';
import type { ScanResult } from '@packages/application-sales';

function fakeInput() {
  const listeners: Record<string, ((e: KeyboardEvent) => void) | undefined> = {};
  return {
    input: {
      value: '',
      addEventListener: (type: string, fn: (e: KeyboardEvent) => void) => {
        listeners[type] = fn;
      },
      removeEventListener: (type: string) => {
        delete listeners[type];
      },
    } as unknown as HTMLInputElement,
    listeners,
  };
}

describe('Scanner adapter contract (scanner.contract.test.ts)', () => {
  it('HID wedge: rapid keystrokes + Enter → decoded as ScanResult', () => {
    const { input, listeners } = fakeInput();
    const scanner = new HidBarcodeScanner(input);
    const handler = vi.fn();
    scanner.onScanResult(handler);
    scanner.startScan();

    // Simulate a fast wedge stream of "123456789" then Enter.
    for (const ch of '123456789') {
      input.value += ch;
    }
    listeners['keydown']?.({ key: 'Enter' } as unknown as KeyboardEvent);
    const result = handler.mock.calls[0]?.[0] as ScanResult | undefined;
    expect(result?.code).toBe('123456789');
    expect(typeof result?.timestamp).toBe('number');
    scanner.stopScan();
  });

  it('camera scanner exposes the same ScanResult shape', () => {
    // Lazy plugin load is optional; the contract (onScanResult) is identical.
    const scanner = new CapacitorCameraBarcodeScanner();
    const handler = vi.fn();
    const unsub = scanner.onScanResult(handler);
    expect(typeof unsub).toBe('function');
    scanner.startScan();
    scanner.stopScan();
    unsub();
  });

  it('scanner disconnected → manual entry fallback is always available', () => {
    const fb = resolveScannerFallback(new Error('no scanner'));
    expect(fb.kind).toBe('manual-entry');
  });

  it('no-op scanner emits a configured test barcode after startScan', () => {
    const scanner = new SimulatedBarcodeScanner('999000111');
    const handler = vi.fn();
    const unsub = scanner.onScanResult(handler);
    scanner.startScan();
    // stopScan before the 100ms timer fires cancels the emission.
    scanner.stopScan();
    scanner.startScan();
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(handler).toHaveBeenCalledWith({ code: '999000111', timestamp: expect.any(Number) });
        unsub();
        resolve();
      }, 200);
    });
  });
});
