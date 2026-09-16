/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_DEMO_ENV?: 'local-demo' | 'external-demo';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
