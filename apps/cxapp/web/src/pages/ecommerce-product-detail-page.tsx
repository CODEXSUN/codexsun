import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function EcommerceProductDetailPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="ecommerce"
      sectionId="products-show"
      productId={params.productId}
    />
  )
}
