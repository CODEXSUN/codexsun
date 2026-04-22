import type { ReactNode } from "react"

import { TechnicalNameOverlayProvider } from "@/components/system/technical-name-overlay-provider"

import {
  RuntimeAppSettingsProvider,
} from "./features/runtime-app-settings/runtime-app-settings-provider"

export function AppRuntimeProviders({ children }: { children: ReactNode }) {
  return (
    <RuntimeAppSettingsProvider>
      <TechnicalNameOverlayProvider>{children}</TechnicalNameOverlayProvider>
    </RuntimeAppSettingsProvider>
  )
}
