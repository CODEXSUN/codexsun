import { useMemo } from "react"

import {
  OverviewSection,
  PurchaseReceiptsSection,
  PurchaseReceiptShowSection,
  PurchaseReceiptUpsertSection,
} from "./workspace/stock-purchase-receipt-sections"
import {
  AvailabilitySection,
  MovementsSection,
  PrintDesignerSection,
  ReconciliationSection,
  ReservationsSection,
  SaleAllocationsSection,
  StockLedgerSection,
  StockReportsSection,
  StockEntrySection,
  TransfersSection,
  VerificationSection,
} from "./workspace/stock-workspace-support-sections"

export {
  GoodsInwardSection,
  GoodsInwardShowSection,
  GoodsInwardUpsertSection,
} from "./workspace/stock-workspace-support-sections"

export function StockWorkspaceSection({
  productId,
  purchaseReceiptId,
  sectionId,
}: {
  productId?: string
  purchaseReceiptId?: string
  sectionId?: string
}) {
  const normalizedSectionId = useMemo(() => sectionId ?? "overview", [sectionId])

  switch (normalizedSectionId) {
    case "purchase-receipts":
      return <PurchaseReceiptsSection />
    case "stock-entry":
      return <StockEntrySection />
    case "purchase-receipts-show":
      return purchaseReceiptId ? <PurchaseReceiptShowSection receiptId={purchaseReceiptId} /> : null
    case "purchase-receipts-upsert":
      return <PurchaseReceiptUpsertSection receiptId={purchaseReceiptId} />
    case "goods-inward":
      return <PurchaseReceiptsSection />
    case "goods-inward-show":
      return <PurchaseReceiptsSection />
    case "goods-inward-upsert":
      return <PurchaseReceiptsSection />
    case "print-designer":
      return <PrintDesignerSection />
    case "sale-allocations":
      return <SaleAllocationsSection />
    case "movements":
      return <MovementsSection />
    case "stock-ledger":
      return <StockLedgerSection />
    case "stock-ledger-show":
      return productId ? <StockLedgerSection productId={productId} /> : <StockLedgerSection />
    case "reports":
      return <StockReportsSection />
    case "availability":
      return <AvailabilitySection />
    case "reconciliation":
      return <ReconciliationSection />
    case "transfers":
      return <TransfersSection />
    case "reservations":
      return <ReservationsSection />
    case "verifications":
      return <VerificationSection />
    case "overview":
    default:
      return <OverviewSection />
  }
}
