import type { AuthUser } from "../../../cxapp/shared/index.js"
import { frappeCustomerCommercialProfileContractResponseSchema } from "../../shared/index.js"
import { assertFrappeViewer } from "./access.js"

export async function readFrappeCustomerCommercialProfileContract(
  user: AuthUser
) {
  assertFrappeViewer(user)

  return frappeCustomerCommercialProfileContractResponseSchema.parse({
    contract: {
      generatedAt: new Date().toISOString(),
      sourceEntity: "frappe_customer_commercial_snapshot",
      targetEntity: "ecommerce_customer_commercial_profile",
      ownershipRule:
        "apps/frappe owns ERP customer-group, territory, and commercial snapshot orchestration; apps/ecommerce remains the owner of customer auth, portal access, coupon lifecycle, and checkout-time customer experience.",
      identityRules: [
        "Enrichment identity must anchor on an existing local ecommerce customer account or linked core contact before any ERP commercial profile data is attached.",
        "ERP customer group, territory, or sales-profile values are enrichment inputs only; they must not create a second customer identity or replace cxapp-authenticated customer ownership in ecommerce.",
        "When multiple ERP commercial records could map to one customer account, projection must stop for operator review instead of silently choosing a profile that could alter later commercial behavior.",
      ],
      fieldMappings: [
        {
          sourceField: "customerNameOrCode",
          targetField: "customerAccountId / coreContactId",
          rule: "Resolve against an existing ecommerce customer account or linked core contact first; do not create a new storefront customer identity from ERP commercial data alone.",
        },
        {
          sourceField: "customerGroup",
          targetField: "commercialProfile.customerGroup",
          rule: "Project as an enrichment attribute only, preserving the current Frappe default-customer-group semantics for later segmentation and policy review.",
        },
        {
          sourceField: "territory",
          targetField: "commercialProfile.territory",
          rule: "Project as contextual commercial metadata for future reporting or segmentation, not as a request-time storefront routing rule today.",
        },
        {
          sourceField: "sellingPriceList",
          targetField: "commercialProfile.priceListHint",
          rule: "Project only as the approved commercial-profile hint that later Frappe pricing normalization may use; ecommerce runtime must not switch live price lists directly from this field.",
        },
        {
          sourceField: "paymentTermsTemplate / salesPartner / taxCategory",
          targetField: "commercialProfile.policyHints",
          rule: "Project only as non-authoritative commercial context for later operator review and staged rollout work, not as direct checkout mutation inputs in the current phase.",
        },
      ],
      lifecycleRules: [
        "Commercial profile projection is one-way: ERP customer commercial snapshot -> Frappe normalization decision -> local ecommerce commercial-profile enrichment. Ecommerce customer edits must not mutate upstream ERP commercial data in reverse.",
        "The enrichment contract must preserve current ecommerce ownership of customer portal access, coupon lifecycle, reward state, and checkout validation; ERP commercial data may annotate those flows later but does not replace them now.",
        "If no local ecommerce customer account or linked contact exists yet, enrichment must wait instead of creating a shadow customer record outside the current shared auth and registration flow.",
        "Projected commercial attributes should be treated as staged metadata for later pricing, segmentation, and ERP-bridge work, not as live request-time pricing or entitlement switches in the current storefront runtime.",
      ],
      outOfScopeRules: [
        "Customer login, registration, session ownership, and portal access remain owned by cxapp plus ecommerce and are not part of this ERP enrichment contract.",
        "Coupon validation, rewards, gift cards, and other portal-owned benefit ledgers remain ecommerce-owned and must not be overwritten by ERP customer-group data.",
        "Live segmented pricing, territory-gated catalogs, or request-time commercial policy evaluation remain later-phase work and are not activated by this enrichment contract alone.",
      ],
    },
  })
}
