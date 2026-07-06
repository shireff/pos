import { isTauri, tauriInvoke } from './tauri-bridge';

export interface DesktopContainer {
  dbConnected: boolean;
  encryptionActive: boolean;
  backupScheduler: { start: () => void };
}

const noopScheduler = {
  start: () => undefined,
};

export async function bootstrapDesktop(): Promise<DesktopContainer> {
  if (!isTauri()) {
    return {
      dbConnected: false,
      encryptionActive: false,
      backupScheduler: noopScheduler,
    };
  }

  try {
    const status = await tauriInvoke<{
      dbConnected?: boolean;
      encryptionActive?: boolean;
    }>('desktop_health_status');

    return {
      dbConnected: status.dbConnected ?? false,
      encryptionActive: status.encryptionActive ?? false,
      backupScheduler: noopScheduler,
    };
  } catch {
    return {
      dbConnected: false,
      encryptionActive: false,
      backupScheduler: noopScheduler,
    };
  }
}
