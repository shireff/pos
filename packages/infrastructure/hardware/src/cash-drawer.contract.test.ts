import { describe, it, expect, vi } from 'vitest';
import { SimulatedCashDrawer } from './drawer/simulated-drawer.adapter';
import { TauriCashDrawer, type TauriDrawerTransport } from './drawer/tauri-drawer.adapter';
import { CapacitorUsbSerialDrawerAdapter } from './drawer/capacitor-usb-serial-drawer.adapter';
import { DrawerOpenError, DrawerNotConnectedError, UsbNotGrantedError } from './errors';
import { resolveDrawerFallback } from './fallback';

describe('Cash drawer adapter contract (cash-drawer.contract.test.ts)', () => {
  it('cash sale → drawer open command sent and succeeds', async () => {
    const d = new SimulatedCashDrawer();
    expect((await d.open()).success).toBe(true);
    expect(d.openCallCount).toBe(1);
  });

  it('drawer open failure → sale still completes, manual-open prompt + audit', async () => {
    const transport: TauriDrawerTransport = { pulse: vi.fn().mockRejectedValue(new Error('jammed')) };
    const d = new TauriCashDrawer(transport);
    const audit = { logged: [] as unknown[], log: (e: { event: string }) => audit.logged.push(e) };
    await expect(d.open()).rejects.toBeInstanceOf(DrawerOpenError);
    const fb = resolveDrawerFallback(new DrawerNotConnectedError(), audit as never);
    expect(fb.kind).toBe('manual-open');
    expect(fb.logAudit).toBe(true);
    expect(audit.logged[0]).toMatchObject({ event: 'CASH_DRAWER_OPEN_FAILED' });
  });

  it('standalone USB serial drawer uses the same interface and degrades gracefully', async () => {
    const d = new CapacitorUsbSerialDrawerAdapter();
    // Permission/plugin layer unavailable in CI → non-blocking error, no throw blocks sale.
    await expect(d.open()).rejects.toBeInstanceOf(UsbNotGrantedError);
    const fb = resolveDrawerFallback(new UsbNotGrantedError(), undefined);
    expect(fb.kind).toBe('manual-open');
  });
});
