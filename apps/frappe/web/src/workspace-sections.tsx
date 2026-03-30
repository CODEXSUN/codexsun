import { FrappeConnectionSection } from "./workspace/connection-section"
import { FrappeItemsSection } from "./workspace/items-section"
import { FrappeOverviewSection } from "./workspace/overview-section"
import { FrappePurchaseReceiptsSection } from "./workspace/purchase-receipts-section"
import { FrappeTodosSection } from "./workspace/todos-section"

export function FrappeWorkspaceSection({ sectionId }: { sectionId?: string }) {
  switch (sectionId ?? "overview") {
    case "connection":
      return <FrappeConnectionSection />
    case "todos":
      return <FrappeTodosSection />
    case "items":
      return <FrappeItemsSection />
    case "purchase-receipts":
      return <FrappePurchaseReceiptsSection />
    case "overview":
      return <FrappeOverviewSection />
    default:
      return null
  }
}
