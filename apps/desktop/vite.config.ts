import * as path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const rootEnvDir = path.resolve(__dirname, '../../');
  const env = loadEnv(mode, rootEnvDir, '');

  return {
    envDir: rootEnvDir,
    define: {
      'process.env': Object.fromEntries(
        Object.entries(env).map(([key, value]) => [key, JSON.stringify(value)]),
      ),
    },
  };
});
