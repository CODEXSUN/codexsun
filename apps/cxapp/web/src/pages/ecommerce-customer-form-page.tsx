import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function EcommerceCustomerFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="ecommerce"
      sectionId="customers-upsert"
      customerId={params.customerId}
    />
  )
}
