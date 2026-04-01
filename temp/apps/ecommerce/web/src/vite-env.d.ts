/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FRONTEND_TARGET?: 'app' | 'web' | 'shop'
  readonly VITE_APP_TARGET?: 'site' | 'ecommerce' | 'billing' | 'app'
  readonly VITE_APP_DEFAULT_WORKSPACE?: 'site' | 'ecommerce' | 'billing'
}

declare const __FRONTEND_TARGET__: string
declare const __APP_MODE__: string
declare const __APP_DEBUG__: boolean
declare const __APP_SKIP_SETUP_CHECK__: boolean
