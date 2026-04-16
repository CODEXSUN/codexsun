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
    id: "goods-inward",
    name: "Goods Inward",
    route: "/dashboard/apps/stock/goods-inward",
    summary: "Verify inward quantity, condition, and posting readiness before stock becomes available.",
  },
  {
    id: "stock-units",
    name: "Stock Units",
    route: "/dashboard/apps/stock/stock-units",
    summary: "Review serialized or batched stock units created from posted inward operations.",
  },
  {
    id: "barcodes",
    name: "Barcode Verify",
    route: "/dashboard/apps/stock/barcodes",
    summary: "Resolve internal and manufacturer barcodes against stock units for verification and issue flows.",
  },
  {
    id: "sticker-batches",
    name: "Sticker Batches",
    route: "/dashboard/apps/stock/sticker-batches",
    summary: "Create and review inventory sticker print batches for inward stock identity.",
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
]
