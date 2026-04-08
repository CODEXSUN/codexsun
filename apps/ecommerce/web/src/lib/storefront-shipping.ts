import type { StorefrontAddress, StorefrontSettings } from "@ecommerce/shared"

export type StorefrontChargeBearingItem = {
  quantity: number
  shippingCharge?: number | null
  handlingCharge?: number | null
}

function normalizeShippingText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase()
}

function normalizePincode(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, "").trim().toLowerCase()
}

export function resolveStorefrontShippingZone(
  settings: Pick<StorefrontSettings, "shippingZones">,
  address?: Pick<StorefrontAddress, "country" | "state" | "pincode"> | null
) {
  const activeZones = settings.shippingZones.filter((zone) => zone.isActive)

  if (activeZones.length === 0) {
    return null
  }

  if (!address) {
    return activeZones.find((zone) => zone.isDefault) ?? activeZones[0] ?? null
  }

  const country = normalizeShippingText(address.country)
  const state = normalizeShippingText(address.state)
  const pincode = normalizePincode(address.pincode)

  const matchedZone = activeZones.find((zone) => {
    const matchesCountry =
      zone.countries.length === 0 ||
      zone.countries.some((item) => normalizeShippingText(item) === country)
    const matchesState =
      zone.states.length === 0 ||
      zone.states.some((item) => normalizeShippingText(item) === state)
    const matchesPincode =
      zone.pincodePrefixes.length === 0 ||
      zone.pincodePrefixes.some((item) => pincode.startsWith(normalizePincode(item)))

    return matchesCountry && matchesState && matchesPincode
  })

  return matchedZone ?? activeZones.find((zone) => zone.isDefault) ?? activeZones[0] ?? null
}

export function calculateStorefrontChargeTotals(
  items: StorefrontChargeBearingItem[],
  settings: Pick<
    StorefrontSettings,
    | "freeShippingThreshold"
    | "defaultShippingAmount"
    | "defaultHandlingAmount"
    | "shippingMethods"
    | "shippingZones"
  >,
  subtotalAmount: number,
  selectedShippingMethodId?: string | null,
  address?: Pick<StorefrontAddress, "country" | "state" | "pincode"> | null
) {
  const activeMethods = settings.shippingMethods.filter((method) => method.isActive)
  const shippingMethod =
    activeMethods.find((method) => method.id === selectedShippingMethodId) ??
    activeMethods.find((method) => method.isDefault) ??
    activeMethods[0] ??
    null
  const shippingZone = resolveStorefrontShippingZone(settings, address)
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
  const fallbackShippingAmount =
    (shippingMethod?.shippingAmount ?? settings.defaultShippingAmount) +
    (shippingZone?.shippingSurchargeAmount ?? 0)
  const fallbackHandlingAmount =
    (shippingMethod?.handlingAmount ?? settings.defaultHandlingAmount) +
    (shippingZone?.handlingSurchargeAmount ?? 0)
  const freeShippingThreshold =
    shippingZone?.freeShippingThresholdOverride ??
    shippingMethod?.freeShippingThreshold ??
    settings.freeShippingThreshold
  const globalShippingAmount =
    subtotalAmount >= freeShippingThreshold ? 0 : fallbackShippingAmount

  return {
    shippingMethod,
    shippingZone,
    codEligible: Boolean(shippingMethod?.codEligible && shippingZone?.codEligible),
    shippingAmount:
      explicitShippingAmount + (fallbackShippingApplies ? globalShippingAmount : 0),
    handlingAmount:
      explicitHandlingAmount +
      (fallbackHandlingApplies && items.length > 0 ? fallbackHandlingAmount : 0),
  }
}
