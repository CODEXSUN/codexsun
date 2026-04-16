import { useParams } from "react-router-dom"

import { FrameworkAppWorkspacePage } from "./framework-app-workspace-page"

export function StockGoodsInwardDetailPage() {
  const params = useParams()

  return (
    <FrameworkAppWorkspacePage
      appId="stock"
      sectionId="goods-inward-show"
      goodsInwardId={params.goodsInwardId}
    />
  )
}
