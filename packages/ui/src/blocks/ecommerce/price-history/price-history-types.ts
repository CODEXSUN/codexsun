export type PriceDataPoint = {
  readonly date: string
  readonly price: number
}

export type PriceHistoryProps = {
  readonly averagePrice?: number
  readonly className?: string
  readonly currencySymbol?: string
  readonly currentPrice: number
  readonly history: readonly PriceDataPoint[]
  readonly lowestPrice?: number
  readonly onSetPriceAlert?: () => void
  readonly peakPrice?: number
  readonly productTitle?: string
}
