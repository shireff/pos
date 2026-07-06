/**
 * tauri-bridge.ts — wraps Tauri `invoke()` calls for native Desktop capabilities.
 * All platform interactions from the React app layer must go through this bridge.
 * This is the ONLY file inside apps/desktop that imports @tauri-apps/api.
 */

/**
 * Invokes a Tauri command by name with optional arguments.
 * Falls back gracefully when not running inside a Tauri context (e.g., browser dev mode).
 */
export async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) {
    throw new Error(
      `[tauri-bridge] Not running inside Tauri. Command "${command}" cannot be invoked.`,
    );
  }
  const { invoke } = await import('@tauri-apps/api/tauri');
  return invoke<T>(command, args);
}

/**
 * Returns true if the current runtime is a Tauri app window.
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
