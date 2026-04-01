import MainLayout from "@/features/store/components/navigation/MainLayout"
import { StorefrontProvider } from "@/features/store/context/storefront-context"
import { OreksoAssistantWidget } from '@framework-core/web/support/orekso-assistant-widget'

export function ShopLayout() {
  return (
    <StorefrontProvider>
      <>
        <MainLayout />
        <OreksoAssistantWidget />
      </>
    </StorefrontProvider>
  )
}

export default ShopLayout

