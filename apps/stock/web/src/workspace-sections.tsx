import { useMemo } from "react"

import {
  OverviewSection,
  PurchaseReceiptsSection,
  PurchaseReceiptShowSection,
  PurchaseReceiptUpsertSection,
} from "./workspace/stock-purchase-receipt-sections"
import {
  AvailabilitySection,
  DeliveryNoteSection,
  DeliveryNoteShowSection,
  DeliveryNoteUpsertSection,
  GoodsRejectionsSection,
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
  GoodsRejectionsSection,
  GoodsInwardSection,
  GoodsInwardShowSection,
  GoodsInwardUpsertSection,
} from "./workspace/stock-workspace-support-sections"

export function StockWorkspaceSection({
  productId,
  purchaseReceiptId,
  deliveryNoteId,
  sectionId,
}: {
  productId?: string
  purchaseReceiptId?: string
  deliveryNoteId?: string
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
    case "goods-rejections":
      return <GoodsRejectionsSection />
    case "delivery-note":
      return <DeliveryNoteSection />
    case "delivery-note-show":
      return deliveryNoteId ? <DeliveryNoteShowSection deliveryNoteId={deliveryNoteId} /> : null
    case "delivery-note-upsert":
      return <DeliveryNoteUpsertSection deliveryNoteId={deliveryNoteId} />
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
