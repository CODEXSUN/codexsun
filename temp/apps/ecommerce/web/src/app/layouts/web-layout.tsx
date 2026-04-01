import MainLayout from "@/features/marketing/components/navigation/MainLayout"
import { OreksoAssistantWidget } from '@framework-core/web/support/orekso-assistant-widget'

export function WebLayout() {
  return (
    <>
      <MainLayout />
      <OreksoAssistantWidget />
    </>
  )
}

export default WebLayout

