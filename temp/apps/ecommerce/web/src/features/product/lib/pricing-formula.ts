import type { ProductPriceInput } from '@shared/index'

export interface PricingFormulaSettings {
  purchaseToSellPercent: number
  purchaseToMrpPercent: number
}

export interface PricingFormulaValues {
  purchasePrice: number
  sellingPrice: number
  mrp: number
}

export function roundUpPrice(value: number) {
  return Math.ceil(value)
}

export function calculatePricingFromPurchase(
  purchasePrice: number,
  settings: PricingFormulaSettings,
) {
  const sellingPrice = roundUpPrice(purchasePrice * (1 + settings.purchaseToSellPercent / 100))
  const mrp = roundUpPrice(purchasePrice * (1 + settings.purchaseToMrpPercent / 100))

  return {
    purchasePrice,
    sellingPrice,
    mrp,
  } satisfies PricingFormulaValues
}

export function applyPricingFormulaToRow(
  row: ProductPriceInput,
  settings: PricingFormulaSettings,
  purchasePrice: number,
) {
  const formula = calculatePricingFromPurchase(purchasePrice, settings)

  return {
    ...row,
    costPrice: formula.purchasePrice,
    sellingPrice: formula.sellingPrice,
    mrp: formula.mrp,
  }
}
