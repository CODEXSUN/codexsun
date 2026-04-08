import type { AuthUser } from "../../../cxapp/shared/index.js"
import { frappePriceProjectionContractResponseSchema } from "../../shared/index.js"
import { assertFrappeViewer } from "./access.js"

export async function readFrappePriceProjectionContract(user: AuthUser) {
  assertFrappeViewer(user)

  return frappePriceProjectionContractResponseSchema.parse({
    contract: {
      generatedAt: new Date().toISOString(),
      sourceEntity: "frappe_item_price_snapshot",
      targetEntity: "core_product_price",
      ownershipRule:
        "apps/frappe owns ERP price-list snapshots and projection orchestration; apps/core remains the authoritative persisted commerce-pricing store that downstream ecommerce runtime reads.",
      identityRules: [
        "Projection identity must anchor on upstream itemCode plus the selected ERP price-list context, with apps/frappe deciding which normalized storefront-effective price row should remain active in core.",
        "Storefront runtime must not choose between ERP price lists, customer groups, or channel rules during live requests; that decision has to be completed before projection into core.",
        "One projected active core price row should represent the effective storefront sell price for a product or variant at a time, and conflicting upstream price-list candidates must stop projection for operator review instead of silently racing.",
      ],
      fieldMappings: [
        {
          sourceField: "itemCode",
          targetField: "product.code",
          rule: "Use the upstream ERP item identity to locate the already projected core product before any price row is created or updated.",
        },
        {
          sourceField: "priceListRate",
          targetField: "sellingPrice",
          rule: "Project the approved ERP effective transaction price directly into the active core price row consumed by ecommerce.",
        },
        {
          sourceField: "referenceMrp",
          targetField: "mrp",
          rule: "Project only the normalized compare-at or list-price value used for storefront strike-through display; leave empty when ERP does not provide a valid compare-at source.",
        },
        {
          sourceField: "costingRate",
          targetField: "costPrice",
          rule: "Project only when ERP exposes an authoritative cost-like source for commerce pricing review; never infer costPrice from sellingPrice.",
        },
        {
          sourceField: "variantItemCode",
          targetField: "variantId",
          rule: "Use only after a later variant projection contract has established stable core variant identity; until then, unresolved variant pricing must not be guessed onto product-level rows.",
        },
        {
          sourceField: "selectedPriceListState",
          targetField: "isActive",
          rule: "Only the normalized storefront-effective projected row should remain active; superseded or non-selected ERP price-list candidates should be stored as inactive or skipped, not exposed to ecommerce reads.",
        },
      ],
      lifecycleRules: [
        "Price projection is one-way: ERP item-price or price-list snapshot -> Frappe normalization decision -> core product-price write. Core or ecommerce edits must not mutate upstream ERP price data in reverse.",
        "Projection must preserve current storefront pricing semantics where sellingPrice is the transaction price, mrp is the compare-at display price, and basePrice remains only a fallback when no active core price row exists.",
        "Projection should update the previously mapped active core price row when the same upstream pricing identity changes, instead of creating unbounded duplicate active rows for one product.",
        "If the target core product has not been projected yet, price projection must stop and wait for the item-master contract rather than creating orphaned price rows.",
      ],
      outOfScopeRules: [
        "Request-time coupon, promotion, and discount stacking stays ecommerce-owned and is not part of the ERP price-list projection contract.",
        "Warehouse, stock availability, and reservation behavior belong to Stage 5.2.3, not the price projection contract.",
        "Live customer-group, territory, or channel-specific ERP price selection during storefront requests remains out of scope; those choices must already be normalized before projection.",
      ],
    },
  })
}
