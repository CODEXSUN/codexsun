export interface StockWorkspaceItem {
  id: string
  name: string
  route: string
  summary: string
}

export const stockWorkspaceItems: StockWorkspaceItem[] = [
  {
    id: "overview",
    name: "Overview",
    route: "/dashboard/apps/stock",
    summary: "Operational stock dashboard for movement, availability, reconciliation, and warehouse execution.",
  },
  {
    id: "purchase-receipts",
    name: "Purchase Receipts",
    route: "/dashboard/apps/stock/purchase-receipts",
    summary: "List, inspect, and maintain supplier-facing purchase receipt documents before physical inward.",
  },
  {
    id: "stock-entry",
    name: "Stock Entry",
    route: "/dashboard/apps/stock/stock-entry",
    summary: "Prepare a simple stock entry with one product and nos count in a single card.",
  },
  {
    id: "goods-rejections",
    name: "Goods Rejections",
    route: "/dashboard/apps/stock/goods-rejections",
    summary: "Review rejected barcode rows captured during sticker verification and track vendor-return notes.",
  },
  {
    id: "stock-ledger",
    name: "Stock Ledger",
    route: "/dashboard/apps/stock/stock-ledger",
    summary: "Review warehouse-wise stock-unit ledger and open warehouse shift flow from one stock page.",
  },
  {
    id: "reports",
    name: "Reports",
    route: "/dashboard/apps/stock/reports",
    summary: "Print purchase receipt challan, stock entry verification, consolidated stock ledger, and daily verification reports.",
  },
  {
    id: "sale-allocations",
    name: "Sale Allocations",
    route: "/dashboard/apps/stock/sale-allocations",
    summary: "Track scan-based stock issue allocations and sold stock-unit traceability.",
  },
  {
    id: "movements",
    name: "Stock Movements",
    route: "/dashboard/apps/stock/movements",
    summary: "Inspect inventory-engine movement history across inward, outward, transfer, and adjustments.",
  },
  {
    id: "availability",
    name: "Real-Time Stock",
    route: "/dashboard/apps/stock/availability",
    summary: "Inspect real-time on-hand, reserved, allocated, damaged, rejected, and available quantities.",
  },
  {
    id: "reconciliation",
    name: "Reconciliation",
    route: "/dashboard/apps/stock/reconciliation",
    summary: "Compare engine-side stock position against current core aggregate stock for mismatch review.",
  },
  {
    id: "transfers",
    name: "Warehouse Transfers",
    route: "/dashboard/apps/stock/transfers",
    summary: "Send, receive, and inspect warehouse transfer records through inventory-engine transfer runtime.",
  },
  {
    id: "reservations",
    name: "Reservations",
    route: "/dashboard/apps/stock/reservations",
    summary: "Reserve stock for pre-sales and inspect allocation, release, and consumption posture.",
  },
  {
    id: "verifications",
    name: "Periodic Verification",
    route: "/dashboard/apps/stock/verifications",
    summary: "Review pending inward verification and warehouse verification readiness by active stock posture.",
  },
  {
    id: "print-designer",
    name: "Print Designer",
    route: "/dashboard/apps/stock/print-designer",
    summary: "Define barcode label size, alignment, visibility, text scale, and barcode rendering rules for stock print output.",
  },
]
