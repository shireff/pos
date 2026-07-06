import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for Smart Retail OS Android shell.
 *
 * appId: Reverse-domain identifier (matches tauri.conf.json for consistency)
 * appName: Human-readable name shown in device launcher
 * webDir: Next.js static export output directory
 * server: Points at dev server in development, uses local files in production
 */
const config: CapacitorConfig = {
  appId: 'com.smart_retail_os.android',
  appName: 'Smart Retail OS',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
    },
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
