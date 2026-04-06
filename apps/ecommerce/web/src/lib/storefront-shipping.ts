import type { StorefrontSettings } from "@ecommerce/shared"

export type StorefrontChargeBearingItem = {
  quantity: number
  shippingCharge?: number | null
  handlingCharge?: number | null
}

export function calculateStorefrontChargeTotals(
  items: StorefrontChargeBearingItem[],
  settings: Pick<
    StorefrontSettings,
    "freeShippingThreshold" | "defaultShippingAmount" | "defaultHandlingAmount"
  >,
  subtotalAmount: number
) {
  const fallbackShippingApplies = items.some((item) => item.shippingCharge == null)
  const fallbackHandlingApplies = items.some((item) => item.handlingCharge == null)
  const explicitShippingAmount = items.reduce(
    (sum, item) => sum + (item.shippingCharge != null ? item.shippingCharge * item.quantity : 0),
    0
  )
  const explicitHandlingAmount = items.reduce(
    (sum, item) => sum + (item.handlingCharge != null ? item.handlingCharge * item.quantity : 0),
    0
  )
  const globalShippingAmount =
    subtotalAmount >= settings.freeShippingThreshold ? 0 : settings.defaultShippingAmount

  return {
    shippingAmount:
      explicitShippingAmount +
      (fallbackShippingApplies ? globalShippingAmount : 0),
    handlingAmount:
      explicitHandlingAmount +
      (fallbackHandlingApplies && items.length > 0 ? settings.defaultHandlingAmount : 0),
  }
}
