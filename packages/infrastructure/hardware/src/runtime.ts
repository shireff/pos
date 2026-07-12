/**
 * Single runtime detection used by both DI containers (Architecture.md §8 /
 * Hardware.md §0). Centralizing this avoids each adapter re-implementing a
 * slightly different `isTauri()` check and keeps the "Tauri vs Capacitor vs
 * CI/Dev" decision in one place.
 */

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in (window as unknown as Record<string, unknown>);
}

export function isCapacitorRuntime(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('Capacitor' in (window as unknown as Record<string, unknown>) ||
      'cordova' in (window as unknown as Record<string, unknown>))
  );
}

/** True when running under Vitest or a CI pipeline — selects no-op adapters. */
export function isTestOrCiRuntime(): boolean {
  return (
    typeof process !== 'undefined' &&
    ((process.env?.VITEST ?? '') === 'true' ||
      (process.env?.NODE_ENV ?? '') === 'test' ||
      (process.env?.CI ?? '') === 'true')
  );
}
