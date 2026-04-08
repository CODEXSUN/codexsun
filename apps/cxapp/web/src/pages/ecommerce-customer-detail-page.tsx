import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function EcommerceCustomerDetailPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="ecommerce"
      sectionId="customers-show"
      customerId={params.customerId}
    />
  )
}
