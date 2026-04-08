import type { AuthUser } from "../../../cxapp/shared/index.js"
import { frappeItemProjectionContractResponseSchema } from "../../shared/index.js"
import { assertFrappeViewer } from "./access.js"

export async function readFrappeItemProjectionContract(user: AuthUser) {
  assertFrappeViewer(user)

  return frappeItemProjectionContractResponseSchema.parse({
    contract: {
      generatedAt: new Date().toISOString(),
      sourceEntity: "frappe_item_snapshot",
      targetEntity: "core_product",
      ownershipRule:
        "apps/frappe owns ERPNext item snapshots and projection orchestration; apps/core remains the authoritative persisted product master consumed by downstream apps.",
      identityRules: [
        "Projection identity must anchor on Frappe item code, with one projected core product per active item code unless a later variant strategy explicitly changes that rule.",
        "Frappe snapshot id is connector-local only; it is not the long-term cross-app business identity.",
        "Projected core product code should reuse ERP itemCode, and duplicate conflicts must stop the projection for operator review instead of silently overwriting a different product.",
      ],
      fieldMappings: [
        {
          sourceField: "itemCode",
          targetField: "code",
          rule: "Project directly and use as the primary upstream product identity key.",
        },
        {
          sourceField: "itemCode",
          targetField: "sku",
          rule: "Reuse as the default SKU until a later variant-aware projection model exists.",
        },
        {
          sourceField: "itemName",
          targetField: "name",
          rule: "Project directly as the core product display name.",
        },
        {
          sourceField: "description",
          targetField: "description",
          rule: "Project as the long product description; empty descriptions remain empty and do not block projection.",
        },
        {
          sourceField: "itemGroup",
          targetField: "productGroupName",
          rule: "Project as the group/category-facing text baseline until explicit ERP-to-core master id mapping exists.",
        },
        {
          sourceField: "brand",
          targetField: "brandName",
          rule: "Project as brand text only; later master-id reconciliation can replace it with core brand ids.",
        },
        {
          sourceField: "gstHsnCode",
          targetField: "hsnCodeId",
          rule: "Treat as the upstream HSN/tax reference candidate, subject to later common-module lookup normalization before authoritative tax posting.",
        },
        {
          sourceField: "disabled",
          targetField: "isActive",
          rule: "Invert the value so disabled ERP items become inactive core products.",
        },
        {
          sourceField: "hasVariants",
          targetField: "hasVariants",
          rule: "Project directly as a capability flag, but do not create core variants until a later variant contract exists.",
        },
      ],
      lifecycleRules: [
        "Projection is one-way: ERP item snapshot -> Frappe projection decision -> core product write. Core product edits must not mutate the upstream Frappe snapshot in reverse.",
        "Projection should create a new core product only when no projected product exists for the item code; otherwise it should update the previously mapped projected product.",
        "Missing price, stock, or media data does not block the item-master projection contract; those concerns remain separate staged projections.",
        "Disabled ERP items should deactivate the projected core product rather than deleting historical product records.",
      ],
      outOfScopeRules: [
        "Price list projection belongs to Stage 5.2.2, not the base item-master contract.",
        "Warehouse and stock projection belongs to Stage 5.2.3, not the base item-master contract.",
        "Variant row synthesis, media ingestion, and category-id reconciliation remain later projection work and must not be silently improvised in the base item contract.",
      ],
    },
  })
}
