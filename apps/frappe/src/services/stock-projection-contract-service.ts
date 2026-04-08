import type { AuthUser } from "../../../cxapp/shared/index.js"
import { frappeStockProjectionContractResponseSchema } from "../../shared/index.js"
import { assertFrappeViewer } from "./access.js"

export async function readFrappeStockProjectionContract(user: AuthUser) {
  assertFrappeViewer(user)

  return frappeStockProjectionContractResponseSchema.parse({
    contract: {
      generatedAt: new Date().toISOString(),
      sourceEntity: "frappe_stock_snapshot",
      targetEntity: "core_product_stock",
      ownershipRule:
        "apps/frappe owns ERP warehouse and stock snapshots plus projection orchestration; apps/core remains the authoritative persisted stock store that storefront and checkout read through ecommerce.",
      identityRules: [
        "Projection identity must anchor on upstream itemCode first, then map onto the already projected core product before any stock row is created or updated.",
        "Warehouse-level ERP detail belongs to the connector and core operational layers; ecommerce storefront runtime must continue reading only aggregated sellable stock from active core stock rows.",
        "Projected core stock rows should preserve one row per resolved product or variant and warehouse combination, and unresolved item or warehouse conflicts must stop projection for operator review instead of silently merging stock.",
      ],
      fieldMappings: [
        {
          sourceField: "itemCode",
          targetField: "product.code",
          rule: "Use the upstream ERP item identity to locate the already projected core product before any stock write is attempted.",
        },
        {
          sourceField: "warehouse",
          targetField: "warehouseId",
          rule: "Project only after ERP warehouse identity has been normalized to a valid core warehouse record or approved compatibility mapping.",
        },
        {
          sourceField: "actualQuantity",
          targetField: "quantity",
          rule: "Project the authoritative on-hand quantity into the active core stock row used for downstream sellable-stock calculation.",
        },
        {
          sourceField: "reservedForStorefront",
          targetField: "reservedQuantity",
          rule: "Only project the portion of stock that should be excluded from sellable quantity in core; never overwrite active ecommerce checkout holds without an explicit reconciliation rule.",
        },
        {
          sourceField: "stockRowState",
          targetField: "isActive",
          rule: "Only stock rows approved for storefront availability should remain active in core; inactive or blocked rows must not contribute to sellable quantity.",
        },
      ],
      lifecycleRules: [
        "Stock projection is one-way: ERP warehouse or stock snapshot -> Frappe normalization decision -> core stock-row write. Core or ecommerce stock edits must not mutate upstream ERP stock in reverse.",
        "Storefront sellable quantity must keep the current ecommerce rule `sum(active quantity - reservedQuantity)` with a floor of zero, so projection cannot bypass or redefine the reserved-hold semantics already enforced at checkout.",
        "Projection may update warehouse-level quantity in core, but ecommerce storefront reads must remain aggregated across active core stock rows and must not expose raw ERP warehouse promises directly to customers.",
        "If the target core product or warehouse mapping does not exist yet, stock projection must stop for operator review rather than creating orphaned rows that storefront runtime cannot interpret safely.",
      ],
      outOfScopeRules: [
        "Live ERP stock checks during storefront request handling remain out of scope; ecommerce must continue reading only persisted core stock rows.",
        "Multi-warehouse customer-facing promises, split-shipment logic, and pickup-only stock allocation remain later commerce work and are not introduced by the stock projection contract.",
        "Purchase receipt snapshot sync and stock valuation workflows are related inputs, but they do not replace the explicit storefront-availability contract defined here.",
      ],
    },
  })
}
