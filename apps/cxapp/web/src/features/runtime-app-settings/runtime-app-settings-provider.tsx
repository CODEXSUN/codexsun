import * as React from "react"

import type { AppSettingsSnapshot } from "../../../../../framework/shared/index.js"

declare global {
  interface Window {
    __CODEXSUN_APP_SETTINGS__?: AppSettingsSnapshot
  }
}

type RuntimeAppSettingsContextValue = {
  settings: AppSettingsSnapshot | null
}

const RuntimeAppSettingsContext = React.createContext<RuntimeAppSettingsContextValue>({
  settings: null,
})

export function RuntimeAppSettingsProvider({
  children,
}: React.PropsWithChildren) {
  const [settings, setSettings] = React.useState<AppSettingsSnapshot | null>(
    () => window.__CODEXSUN_APP_SETTINGS__ ?? null
  )

  React.useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      if (window.__CODEXSUN_APP_SETTINGS__) {
        setSettings(window.__CODEXSUN_APP_SETTINGS__ ?? null)
        return
      }

      try {
        const response = await fetch("/public/v1/app-settings")
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as { item?: AppSettingsSnapshot }

        if (!cancelled) {
          const nextSettings = payload.item ?? null
          window.__CODEXSUN_APP_SETTINGS__ = nextSettings ?? undefined
          setSettings(nextSettings)
        }
      } catch {
        if (!cancelled) {
          setSettings(null)
        }
      }
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <RuntimeAppSettingsContext.Provider value={{ settings }}>
      {children}
    </RuntimeAppSettingsContext.Provider>
  )
}

export function useRuntimeAppSettings() {
  return React.useContext(RuntimeAppSettingsContext)
}
