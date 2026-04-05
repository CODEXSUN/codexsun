import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function EcommerceProductFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="ecommerce"
      sectionId="products-upsert"
      productId={params.productId}
    />
  )
}
