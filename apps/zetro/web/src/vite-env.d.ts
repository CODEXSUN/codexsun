/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ZETRO_BUILD_VERSION: string
  readonly VITE_ZETRO_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
