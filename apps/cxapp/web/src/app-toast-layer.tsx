import { Toaster } from "@/components/ui/sonner"

import { useRuntimeAppSettings } from "./features/runtime-app-settings/runtime-app-settings-provider"

export function AppToastLayer() {
  const { settings } = useRuntimeAppSettings()

  return (
    <Toaster
      position={settings?.uiFeedback.toast.position ?? "top-right"}
      tone={settings?.uiFeedback.toast.tone ?? "soft"}
      closeButton
    />
  )
}
