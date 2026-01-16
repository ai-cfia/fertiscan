/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // DEV, PROD, MODE, SSR, BASE_URL are automatically provided by vite/client
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
