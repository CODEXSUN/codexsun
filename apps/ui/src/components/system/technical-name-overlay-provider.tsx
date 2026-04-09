import * as React from "react"

import { useRuntimeAppSettings } from "@cxapp/web/src/features/runtime-app-settings/runtime-app-settings-provider"

type TechnicalNameOverlayContextValue = {
  enabled: boolean
}

const TechnicalNameOverlayContext =
  React.createContext<TechnicalNameOverlayContextValue>({
    enabled: false,
  })

export function TechnicalNameOverlayProvider({
  children,
}: React.PropsWithChildren) {
  const { settings } = useRuntimeAppSettings()
  const enabled = Boolean(settings?.uiDeveloperTools.showTechnicalNames)

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    const root = document.documentElement
    root.dataset.devtoolsNamesEnabled = enabled ? "true" : "false"

    return () => {
      delete root.dataset.devtoolsNamesEnabled
    }
  }, [enabled])

  return (
    <TechnicalNameOverlayContext.Provider value={{ enabled }}>
      {children}
    </TechnicalNameOverlayContext.Provider>
  )
}

export function useTechnicalNameOverlay() {
  return React.useContext(TechnicalNameOverlayContext)
}
