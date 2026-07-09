/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_API_TIMEOUT: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Injected at build time by vite.config.ts define
declare const __APP_VERSION__: string;
