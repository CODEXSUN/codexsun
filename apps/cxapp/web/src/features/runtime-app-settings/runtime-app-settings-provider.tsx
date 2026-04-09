import * as React from "react"

import type { AppSettingsSnapshot } from "../../../../../framework/shared/index.js"
import { useRuntimeAppSettingsQuery } from "../../query/runtime-queries"

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
  const { data: settings } = useRuntimeAppSettingsQuery()

  return (
    <RuntimeAppSettingsContext.Provider value={{ settings: settings ?? null }}>
      {children}
    </RuntimeAppSettingsContext.Provider>
  )
}

export function useRuntimeAppSettings() {
  return React.useContext(RuntimeAppSettingsContext)
}
