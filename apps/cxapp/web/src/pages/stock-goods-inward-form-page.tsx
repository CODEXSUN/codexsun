import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function StockGoodsInwardFormPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="stock"
      sectionId="goods-inward-upsert"
      goodsInwardId={params.goodsInwardId}
    />
  )
}
