import type { CashDrawer } from '@packages/application-sales';
import { DrawerOpenError } from '../errors';

export interface TauriDrawerTransport {
  pulse(): Promise<void>;
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in (window as unknown as Record<string, unknown>);
}

/** Default transport: invokes the Rust drawer-open (RJ11 pulse) command. */
export class TauriInvokeDrawerTransport implements TauriDrawerTransport {
  public async pulse(): Promise<void> {
    if (!isTauri()) throw new DrawerOpenError('Not running inside Tauri');
    const { invoke } = await import('@tauri-apps/api/tauri');
    await invoke('open_cash_drawer');
  }
}

/**
 * TauriCashDrawer is the real adapter for the Desktop (Tauri) shell. A drawer
 * that fails to open (jammed, disconnected) throws DrawerOpenError — this must
 * NOT block sale completion (Hardware.md §4). The caller logs and prompts a
 * manual open.
 */
export class TauriCashDrawer implements CashDrawer {
  private readonly transport: TauriDrawerTransport;

  public constructor(transport: TauriDrawerTransport = new TauriInvokeDrawerTransport()) {
    this.transport = transport;
  }

  public async open(): Promise<{ success: boolean }> {
    try {
      await this.transport.pulse();
      return { success: true };
    } catch (err) {
      throw new DrawerOpenError('Cash drawer failed to open', err);
    }
  }
}
