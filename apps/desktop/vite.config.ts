import * as path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'fs';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version?: string };

export default defineConfig(({ mode }) => {
  const rootEnvDir = path.resolve(__dirname, '../../');
  const env = loadEnv(mode, rootEnvDir, '');

  const apiBase = env.VITE_API_BASE_URL ?? 'http://localhost:3001';

  return {
    envDir: rootEnvDir,

    // Proxy /api/* to the Next.js backend — eliminates CORS entirely in dev
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    define: {
      // In dev with proxy, API calls go to same origin (localhost:5173/api/...)
      // so baseURL should be '' (empty = same origin).
      // In production builds, use the real API URL.
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        mode === 'development' ? '' : apiBase,
      ),
      'import.meta.env.VITE_API_TIMEOUT': JSON.stringify(
        env.VITE_API_TIMEOUT ?? '15000',
      ),
      __APP_VERSION__: JSON.stringify(pkg.version ?? '1.0.0'),
    },
  };
});
