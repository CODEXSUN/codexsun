export type PriceDataPoint = {
  readonly date: string
  readonly price: number
}

export type PriceHistoryProps = {
  readonly averagePrice?: number | undefined
  readonly className?: string | undefined
  readonly currencySymbol?: string | undefined
  readonly currentPrice: number
  readonly history: readonly PriceDataPoint[]
  readonly lowestPrice?: number | undefined
  readonly onSetPriceAlert?: (() => void) | undefined
  readonly peakPrice?: number | undefined
  readonly productTitle?: string | undefined
}
