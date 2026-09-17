export type CartItem = {
  readonly discount?: string
  readonly id: string
  readonly image: string
  readonly inStock?: boolean
  readonly originalPrice?: string
  readonly price: string
  readonly priceValue: number
  readonly quantity: number
  readonly title: string
  readonly variant?: string
}

export type StorefrontCartProps = {
  readonly className?: string
  readonly currencySymbol?: string
  readonly freeShippingThreshold?: number
  readonly isDrawer?: boolean
  readonly items: readonly CartItem[]
  readonly onCheckout?: () => void
  readonly onClose?: () => void
  readonly onQuantityChange?: (itemId: string, newQuantity: number) => void
  readonly onRemoveItem?: (itemId: string) => void
  readonly open?: boolean
  readonly promoCode?: string
  readonly promoDiscountValue?: number
}
