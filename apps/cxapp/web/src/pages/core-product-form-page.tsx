import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function CoreProductFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="core"
      sectionId="products-upsert"
      productId={params.productId}
    />
  )
}
