import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function CoreProductDetailPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="core"
      sectionId="products-show"
      productId={params.productId}
    />
  )
}
