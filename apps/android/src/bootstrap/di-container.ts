/**
 * Android DI Container
 *
 * Wires infrastructure adapters via Capacitor plugin bridges.
 * All adapters are injected via constructor injection — no singletons
 * are exposed as mutable globals.
 *
 * In the Android shell, platform capabilities (storage, notifications, etc.)
 * are accessed exclusively through @capacitor/* plugins; native Kotlin/Java
 * UI code is never written.
 */

// Re-export the Capacitor plugin bridge wrappers for bootstrap usage
export { CapacitorHealthBridge } from './capacitor-health.bridge';
