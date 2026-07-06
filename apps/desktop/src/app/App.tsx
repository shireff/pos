import React, { useEffect, useState } from 'react';
import { HealthScreen, HealthStatus } from '@packages/ui-components';
import { bootstrapDesktop } from '../bootstrap/di-container';

const APP_VERSION = process.env.npm_package_version ?? '1.0.0';

/**
 * Root App component for Desktop shell.
 * On mount:  initializes the DI container (MongoDB + migration runner + backup).
 * Renders:   the shared HealthScreen component with live status.
 */
export default function App() {
  const [status, setStatus] = useState<HealthStatus>({
    dbConnected: false,
    encryptionActive: false,
    appVersion: APP_VERSION,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const container = await bootstrapDesktop();
        setStatus({
          dbConnected: container.dbConnected,
          encryptionActive: container.encryptionActive,
          appVersion: APP_VERSION,
        });
        container.backupScheduler.start();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[App] Bootstrap failed:', err);
      }
    };

    void init();
  }, []);

  return <HealthScreen {...status} />;
}
